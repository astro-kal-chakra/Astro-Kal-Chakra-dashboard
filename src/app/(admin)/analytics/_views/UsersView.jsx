import { formatNumber, formatPercent } from "@/lib/utils";
import { TrendChart, BarChart } from "@/components/charts/Charts";
import { ChartCard, Grid, KpiRow, ViewStack } from "./ChartCard";

export function UsersView({ a }) {
  const { totals: t, change: c, range } = a;
  return (
    <ViewStack>
      <KpiRow
        items={[
          { label: "New signups", value: formatNumber(t.signups), change: c.signups, href: "/users?joined=30d" },
          { label: "Active users (avg/day)", value: formatNumber(Math.round(t.activeUsers)), change: c.activeUsers },
          { label: "First-recharge conversion", value: formatPercent(t.firstRechargeRate), change: c.firstRechargeRate },
          { label: "Referral signups", value: formatNumber(t.referralSignups), change: c.referralSignups },
        ]}
      />
      <Grid>
        <ChartCard title="New signups" description={`Per ${range.group}`}>
          <TrendChart data={a.series} series={[{ key: "signups", label: "Signups" }]} compare={range.compare} href="/users?status=new" />
        </ChartCard>
        <ChartCard title="Active users" description={`Daily average per ${range.group}`}>
          <TrendChart data={a.series} series={[{ key: "activeUsers", label: "Active users", color: 1 }]} compare={range.compare} />
        </ChartCard>
      </Grid>
      <ChartCard title="Retention by signup cohort" description="% of the cohort still active in each week after signup">
        <Retention cohorts={a.retention} />
      </ChartCard>
      <Grid>
        <ChartCard title="Users by city" description="Top cities, all time">
          <BarChart horizontal data={a.usersByCity.slice(0, 8)} xKey="city" series={[{ key: "users", label: "Users" }]} height={300} />
        </ChartCard>
        <ChartCard title="Users by language" description="App language preference">
          <BarChart horizontal data={a.usersByLanguage} xKey="language" series={[{ key: "users", label: "Users", color: 4 }]} height={300} />
        </ChartCard>
      </Grid>
    </ViewStack>
  );
}

/** Cohort heatmap: one hue, intensity encodes retention (sequential). */
function Retention({ cohorts }) {
  const weeks = Math.max(...cohorts.map((c) => c.weeks.length));
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-1 text-xs">
        <thead>
          <tr className="text-muted">
            <th className="px-2 py-1 text-left font-semibold">Cohort</th>
            <th className="px-2 py-1 text-right font-semibold">Users</th>
            {Array.from({ length: weeks }, (_, w) => (
              <th key={w} className="px-2 py-1 font-semibold">
                Wk {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.cohort}>
              <td className="px-2 py-1 font-semibold whitespace-nowrap text-text">{c.cohort}</td>
              <td className="px-2 py-1 text-right text-text-2 tabular-nums">{formatNumber(c.size)}</td>
              {Array.from({ length: weeks }, (_, w) => {
                const v = c.weeks[w];
                return (
                  <td key={w} className="p-0">
                    {v == null ? (
                      <div className="h-9 rounded-md bg-surface-2" />
                    ) : (
                      <div
                        className="flex h-9 items-center justify-center rounded-md font-semibold tabular-nums"
                        style={{
                          background: `color-mix(in oklab, var(--series-1) ${Math.round(10 + v * 0.8)}%, var(--surface))`,
                          color: v > 45 ? "#fff" : "var(--text)",
                        }}
                        title={`${c.cohort} · week ${w}: ${v}%`}
                      >
                        {v}%
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
