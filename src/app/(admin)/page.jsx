import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, CreditCard, Flag, IndianRupee, LifeBuoy, Radio, Sparkles, UserPlus, Users, Hourglass, Wallet, MessagesSquare } from "lucide-react";
import { checkAccess } from "@/lib/session";
import { getAnalytics } from "@/services/analytics";
import { getAttentionCounts, getLiveSnapshot } from "@/services";
import { flatParams } from "@/lib/url";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/Table";
import { PersonCell } from "@/components/ui/Avatar";
import { TrendChart, BarChart, DonutChart } from "@/components/charts/Charts";
import { DateRangeFilter } from "@/components/charts/DateRangeFilter";

export const metadata = { title: "Overview" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function OverviewPage({ searchParams }) {
  const { admin, denied } = await checkAccess("overview");
  if (denied) return denied;

  const sp = flatParams(await searchParams);
  const [a, live, counts] = await Promise.all([
    getAnalytics({ preset: sp.preset ?? "7d", from: sp.from, to: sp.to, group: sp.group, compare: sp.compare }),
    getLiveSnapshot(),
    getAttentionCounts(),
  ]);
  const { totals: t, change: c } = a;
  const sessions = t.chats + t.voiceCalls + t.videoCalls;
  const prevSessions = a.previous.chats + a.previous.voiceCalls + a.previous.videoCalls;
  const sessionsChange = prevSessions ? ((sessions - prevSessions) / prevSessions) * 100 : 0;
  const can = (m) => admin.role.permissions[m]?.includes("view");

  const attention = [
    { label: "Astrologer approvals", count: counts.pendingApprovals, href: "/astrologers?status=pending", icon: Sparkles, module: "astrologers", tone: "bg-primary-soft text-primary-ink" },
    { label: "Payout requests", count: counts.payoutRequests, href: "/payouts", icon: Banknote, module: "payouts", tone: "bg-success-soft text-success" },
    { label: "Open tickets", count: counts.openTickets, href: "/support?status=open", icon: LifeBuoy, module: "support", tone: "bg-info-soft text-info" },
    { label: "Flagged chats", count: counts.flaggedChats, href: "/chats/flagged", icon: Flag, module: "chats", tone: "bg-warning-soft text-warning" },
    { label: "Failed payments (7d)", count: counts.failedPayments, href: "/payments?status=failed", icon: AlertTriangle, module: "payments", tone: "bg-danger-soft text-danger" },
  ].filter((x) => can(x.module));

  const sessionSeries = a.series.map((r) => ({ label: r.label, chats: r.chats, voiceCalls: r.voiceCalls, videoCalls: r.videoCalls }));

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title={`${greeting()}, ${admin.name.split(" ")[0]}`}
        description="Here's what's happening on the platform."
        actions={<DateRangeFilter range={a.range} />}
        className="mb-0 sm:mb-0"
      />

      {/* Live */}
      <section aria-label="Live now" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard live label="Live sessions now" value={formatNumber(live.liveSessions)} icon={<Radio />} href={can("sessions") ? "/sessions/live" : undefined} hint="Updated just now" />
        <StatCard live label="Online astrologers" value={formatNumber(live.onlineAstrologers)} icon={<Sparkles />} href={can("astrologers") ? "/astrologers?status=approved" : undefined} hint="Available to take requests" />
        <StatCard label="People in queues" value={formatNumber(live.inQueue)} icon={<Hourglass />} href={can("sessions") ? "/sessions/live" : undefined} hint="Waiting across all astrologers" />
      </section>

      {/* KPIs for the period */}
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="New users" value={formatNumber(t.signups, true)} change={c.signups} icon={<UserPlus />} href={can("users") ? "/users?joined=7d" : undefined} hint="vs prev." />
        <StatCard label="Active users (avg/day)" value={formatNumber(Math.round(t.activeUsers), true)} change={c.activeUsers} icon={<Users />} hint="vs prev." />
        <StatCard label="Total sessions" value={formatNumber(sessions, true)} change={sessionsChange} icon={<MessagesSquare />} href={can("sessions") ? "/sessions" : undefined} hint="chat · voice · video" />
        <StatCard label="Revenue" value={formatCurrency(t.revenue, true)} change={c.revenue} icon={<IndianRupee />} href={can("payments") ? "/payments?status=success" : undefined} hint="vs prev." />
        <StatCard label="Wallet recharges" value={formatNumber(t.recharges, true)} change={c.recharges} icon={<Wallet />} href={can("payments") ? "/payments" : undefined} hint={formatCurrency(t.rechargeAmount, true)} />
        <StatCard label="Failed payments" value={formatNumber(t.failedPayments)} change={c.failedPayments} invert icon={<CreditCard />} href={can("payments") ? "/payments?status=failed" : undefined} hint="vs prev." />
      </section>

      {/* Needs attention */}
      {attention.length > 0 && (
        <section aria-label="Needs attention">
          <h2 className="mb-2.5 text-sm font-bold text-text">Needs attention</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {attention.map((x) => (
              <Link
                key={x.label}
                href={x.href}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-card transition hover:border-border-strong"
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${x.tone}`}>
                  <x.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl leading-tight font-extrabold text-text tabular-nums">{x.count}</span>
                  <span className="block truncate text-xs font-medium text-muted">{x.label}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-text max-sm:hidden" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue"
            description={`Gross revenue by ${a.range.group} · ${a.range.label}`}
            action={can("analytics") && <Button size="sm" variant="ghost" href="/analytics?view=revenue" iconRight={<ArrowRight />}>Details</Button>}
          />
          <CardBody>
            <TrendChart data={a.series} series={[{ key: "revenue", label: "Revenue" }]} format="currency" compare={a.range.compare} href={can("payments") ? "/payments?status=success" : undefined} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Sessions by mode" description={a.range.label} />
          <CardBody>
            <DonutChart data={a.modeSplit} centerLabel="Sessions" href={can("sessions") ? "/sessions" : undefined} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Sessions over time" description="Chat, voice and video, stacked" />
          <CardBody>
            <BarChart
              data={sessionSeries}
              stacked
              series={[
                { key: "chats", label: "Chat" },
                { key: "voiceCalls", label: "Voice" },
                { key: "videoCalls", label: "Video" },
              ]}
              href={can("sessions") ? "/sessions" : undefined}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Peak hours" description="Average chats started per hour" />
          <CardBody>
            <BarChart data={a.hourly} series={[{ key: "chats", label: "Chats" }]} height={260} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Top astrologers"
          description="By earnings, all time"
          action={can("analytics") && <Button size="sm" variant="ghost" href="/analytics?view=top" iconRight={<ArrowRight />}>All top lists</Button>}
        />
        <DataTable
          rows={a.topAstrologers.slice(0, 5)}
          rowHref={can("astrologers") ? (r) => `/astrologers/${r.id}` : undefined}
          columns={[
            { key: "name", label: "Astrologer", render: (r) => <PersonCell name={r.name} sub={r.id} /> },
            { key: "sessions", label: "Sessions", align: "right", render: (r) => formatNumber(r.sessions) },
            { key: "rating", label: "Rating", align: "right", render: (r) => `${r.rating} ★` },
            { key: "complaints", label: "Complaints", align: "right", hideOnMobile: true },
            { key: "earnings", label: "Earnings", align: "right", render: (r) => <span className="font-semibold text-text">{formatCurrency(r.earnings)}</span> },
          ]}
        />
      </Card>
    </div>
  );
}
