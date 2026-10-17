import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Gift, Heart, MessageSquare, Users } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getLiveStream } from "@/services";
import { formatCurrency, formatDateTime, formatDuration, formatNumber, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MiniStat } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AutoRefresh } from "@/components/common/AutoRefresh";
import { EndLive } from "../_components/EndLive";

export const metadata = { title: "Live stream" };

const KIND = { gift: "Gift", tip: "Tip", question: "Paid question" };

export default async function LiveStreamPage({ params }) {
  const { denied } = await checkAccess("sessions");
  if (denied) return denied;
  const { id } = await params;
  const r = await getLiveStream(id);
  if (!r) notFound();
  const isLive = r.status === "live";

  return (
    <>
      <PageHeader
        back={{ href: `/sessions/live-streams?status=${isLive ? "live" : "ended"}`, label: "Live streams" }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={r.astrologer.name} size="lg" />
            <span className="min-w-0">
              {r.title || "Live"}
              <span className="mt-0.5 block text-sm font-medium text-muted">
                <Link href={`/astrologers/${r.astrologer.id}`} className="hover:text-primary">
                  {r.astrologer.name}
                </Link>
                {r.topic ? ` · ${r.topic}` : ""}
                {r.language ? ` · ${r.language}` : ""}
              </span>
            </span>
          </span>
        }
        meta={isLive ? <Badge tone="danger" dot>LIVE · {formatDuration(r.durationSec)}</Badge> : <Badge>Ended {r.endedAt ? timeAgo(r.endedAt) : ""}</Badge>}
        actions={
          isLive ? (
            <>
              <AutoRefresh seconds={15} />
              <EndLive room={r} size="sm" />
            </>
          ) : null
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mb-5 lg:grid-cols-6">
        <MiniStat label="Watching now" value={isLive ? formatNumber(r.viewersNow) : "—"} accent={isLive} />
        <MiniStat label="Joined in total" value={formatNumber(r.totalViewers)} />
        <MiniStat label="Peak at once" value={formatNumber(r.peakViewers)} />
        <MiniStat label="Comments" value={formatNumber(r.comments)} />
        <MiniStat label="Hearts" value={formatNumber(r.hearts)} />
        <MiniStat label="Gifts & questions" value={formatCurrency(r.amount)} hint={`${formatNumber(r.gifts + r.questions)} · astrologer ${formatCurrency(r.astroEarning)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Eye className="size-4" /> Watching now
              </span>
            }
            description={isLive ? `${formatNumber(r.viewers.length)} signed-in users${r.guestsWatching ? ` · ${formatNumber(r.guestsWatching)} website visitors (not signed in)` : ""}` : "The stream has ended"}
          />
          <CardBody>
            {isLive && r.viewers.length ? (
              <ul className="divide-y divide-border">
                {r.viewers.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 py-2">
                    <Avatar name={v.name} size="sm" />
                    <Link href={`/users/${v.id}`} className="min-w-0 flex-1 truncate font-medium text-text hover:text-primary">
                      {v.name}
                    </Link>
                    <span className="text-xs text-muted">{v.city || v.id}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<Users />} title={isLive ? "No signed-in viewers right now" : "Not live any more"} description={isLive ? "Guests watching without signing in are counted above." : `Started ${r.startedAt ? formatDateTime(r.startedAt) : "—"} · ${formatDuration(r.durationSec)}`} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Gift className="size-4" /> Gifts & paid questions
              </span>
            }
            description="Latest 30"
          />
          <CardBody>
            {r.activity.length ? (
              <ul className="divide-y divide-border">
                {r.activity.map((a, i) => (
                  <li key={`${a.at}-${i}`} className="flex items-start gap-3 py-2">
                    <span className="mt-0.5 text-muted [&_svg]:size-4">{a.kind === "question" ? <MessageSquare /> : a.kind === "tip" ? <Heart /> : <Gift />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {a.user ? (
                          <Link href={`/users/${a.user.id}`} className="hover:text-primary">
                            {a.user.name}
                          </Link>
                        ) : (
                          "User"
                        )}{" "}
                        · {KIND[a.kind] || a.kind}
                        {a.gift ? ` · ${a.gift}` : ""}
                      </p>
                      {a.message && <p className="truncate text-xs text-muted">{a.message}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(a.amount)}</p>
                      <p className="text-[11px] text-muted">{timeAgo(a.at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<Gift />} title="No gifts yet" description="Gifts, tips and paid questions show here." />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
