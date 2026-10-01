import { formatNumber, formatPercent } from "@/lib/utils";
import { TrendChart, BarChart } from "@/components/charts/Charts";
import { ChartCard, Grid, KpiRow, SectionTitle, ViewStack } from "./ChartCard";

export function FunnelView({ a }) {
  const { totals: t, change: c, range } = a;
  const steps = [
    { label: "Free chats taken", value: t.freeChats },
    { label: "Converted to paid", value: t.freeConverted },
    { label: "Dropped off", value: t.freeDropped, muted: true },
  ];
  return (
    <ViewStack>
      <KpiRow
        items={[
          { label: "Free chats taken", value: formatNumber(t.freeChats), change: c.freeChats },
          { label: "Converted to paid", value: formatNumber(t.freeConverted), change: c.freeConverted },
          { label: "Conversion rate", value: formatPercent(t.freeConversion), change: c.freeConversion },
          { label: "Drop-off", value: formatNumber(t.freeDropped), change: c.freeDropped, invert: true },
        ]}
      />
      <Grid>
        <ChartCard title="Free chat funnel" description={range.label}>
          <div className="space-y-4 py-2">
            {steps.map((s) => {
              const pct = t.freeChats ? (s.value / t.freeChats) * 100 : 0;
              return (
                <div key={s.label}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-text">{s.label}</span>
                    <span className="text-text-2 tabular-nums">
                      <span className="font-bold text-text">{formatNumber(s.value)}</span> · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-surface-3">
                    <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: s.muted ? "var(--border-strong)" : "var(--series-1)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
        <ChartCard title="Free chat conversion" description="% of free chats followed by a paid session">
          <TrendChart data={a.series} series={[{ key: "freeConversion", label: "Conversion" }]} format="percent" compare={range.compare} />
        </ChartCard>
      </Grid>

      <SectionTitle>Queue</SectionTitle>
      <KpiRow
        items={[
          { label: "Average wait time", value: `${Math.round(t.avgWaitSec)}s`, change: c.avgWaitSec, invert: true },
          { label: "Abandoned queue entries", value: formatNumber(t.queueAbandoned), change: c.queueAbandoned, invert: true },
          { label: "Missed requests", value: formatNumber(t.missedRequests), change: c.missedRequests, invert: true, href: "/sessions?status=missed" },
        ]}
      />
      <Grid>
        <ChartCard title="Average wait time" description="Seconds from request to accept">
          <TrendChart data={a.series} series={[{ key: "avgWaitSec", label: "Wait time", color: 4 }]} format="duration" compare={range.compare} />
        </ChartCard>
        <ChartCard title="Abandoned vs missed" description={`Per ${range.group}`}>
          <BarChart
            data={a.series}
            series={[
              { key: "queueAbandoned", label: "Abandoned in queue", color: 1 },
              { key: "missedRequests", label: "Missed by astrologer", color: 4 },
            ]}
            href="/sessions?status=missed"
          />
        </ChartCard>
      </Grid>
    </ViewStack>
  );
}
