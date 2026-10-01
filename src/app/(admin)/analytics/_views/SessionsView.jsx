import { formatNumber, formatPercent } from "@/lib/utils";
import { TrendChart, BarChart, DonutChart } from "@/components/charts/Charts";
import { ChartCard, Grid, KpiRow, SectionTitle, ViewStack } from "./ChartCard";

export function SessionsView({ a }) {
  const { totals: t, change: c, range } = a;
  return (
    <ViewStack>
      <SectionTitle>Chats</SectionTitle>
      <KpiRow
        items={[
          { label: "Chats", value: formatNumber(t.chats), change: c.chats, href: "/sessions?mode=chat" },
          { label: "Chat minutes", value: formatNumber(t.chatMinutes, true), change: c.chatMinutes },
          { label: "Avg chat duration", value: `${t.avgChatMin.toFixed(1)} min`, change: c.avgChatMin },
        ]}
      />
      <Grid>
        <ChartCard title="Number of chats" description={`Per ${range.group}`}>
          <TrendChart data={a.series} series={[{ key: "chats", label: "Chats" }]} compare={range.compare} href="/sessions?mode=chat" />
        </ChartCard>
        <ChartCard title="Average chat duration" description="Minutes per chat">
          <TrendChart data={a.series} series={[{ key: "avgChatMin", label: "Avg duration", color: 1 }]} format="minutes" compare={range.compare} />
        </ChartCard>
        <ChartCard title="Total chat minutes" description={`Per ${range.group}`}>
          <BarChart data={a.series} series={[{ key: "chatMinutes", label: "Minutes", color: 4 }]} />
        </ChartCard>
        <ChartCard title="Peak hours" description="Average sessions started by hour of day">
          <BarChart
            data={a.hourly}
            stacked
            series={[
              { key: "chats", label: "Chats" },
              { key: "calls", label: "Calls", color: 1 },
            ]}
          />
        </ChartCard>
      </Grid>

      <SectionTitle>Voice & video calls</SectionTitle>
      <KpiRow
        items={[
          { label: "Calls", value: formatNumber(t.calls), change: c.calls, href: "/calls" },
          { label: "Call minutes", value: formatNumber(t.callMinutes, true), change: c.callMinutes },
          { label: "Avg call duration", value: `${t.avgCallMin.toFixed(1)} min`, change: c.avgCallMin },
          { label: "Drop / disconnect rate", value: formatPercent(t.dropRate), change: c.dropRate, invert: true, href: "/calls?quality=poor" },
        ]}
      />
      <Grid cols={3}>
        <ChartCard title="Calls by type" description={`Per ${range.group}`} className="lg:col-span-2">
          <BarChart
            data={a.series}
            stacked
            series={[
              { key: "voiceCalls", label: "Voice" },
              { key: "videoCalls", label: "Video", color: 2 },
            ]}
            href="/calls"
          />
        </ChartCard>
        <ChartCard title="Session mix" description={range.label}>
          <DonutChart data={a.modeSplit} centerLabel="Sessions" href="/sessions" />
        </ChartCard>
      </Grid>
      <Grid>
        <ChartCard title="Average call duration" description="Minutes per call">
          <TrendChart data={a.series} series={[{ key: "avgCallMin", label: "Avg duration", color: 4 }]} format="minutes" compare={range.compare} />
        </ChartCard>
        <ChartCard title="Drop / disconnect rate" description="% of calls ended by network drop or crash">
          <TrendChart data={a.series} series={[{ key: "dropRate", label: "Drop rate", color: 1 }]} format="percent" compare={range.compare} href="/calls" />
        </ChartCard>
      </Grid>
    </ViewStack>
  );
}
