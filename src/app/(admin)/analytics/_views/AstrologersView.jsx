import { formatNumber } from "@/lib/utils";
import { TrendChart, BarChart } from "@/components/charts/Charts";
import { ChartCard, Grid, KpiRow, ViewStack } from "./ChartCard";

export function AstrologersView({ a }) {
  const { totals: t, change: c, range } = a;
  return (
    <ViewStack>
      <KpiRow
        items={[
          { label: "New applications", value: formatNumber(t.astroApplications), change: c.astroApplications, href: "/astrologers?status=pending" },
          { label: "Approved", value: formatNumber(t.astroApproved), change: c.astroApproved, href: "/astrologers?status=approved" },
          { label: "Rejected", value: formatNumber(t.astroRejected), change: c.astroRejected, invert: true, href: "/astrologers?status=rejected" },
          { label: "Active astrologers (avg/day)", value: formatNumber(Math.round(t.activeAstrologers)), change: c.activeAstrologers },
        ]}
      />
      <Grid>
        <ChartCard title="New applications" description={`Per ${range.group}`}>
          <TrendChart data={a.series} series={[{ key: "astroApplications", label: "Applications" }]} compare={range.compare} href="/astrologers?status=pending" />
        </ChartCard>
        <ChartCard title="Approved vs rejected" description={`Decisions per ${range.group}`}>
          <BarChart
            data={a.series}
            series={[
              { key: "astroApproved", label: "Approved", color: 2 },
              { key: "astroRejected", label: "Rejected", color: 1 },
            ]}
          />
        </ChartCard>
        <ChartCard title="Online hours" description="Total hours astrologers were available">
          <TrendChart data={a.series} series={[{ key: "astroOnlineHours", label: "Online hours", color: 4 }]} compare={range.compare} />
        </ChartCard>
        <ChartCard title="Active astrologers" description="Took at least one session (daily average)">
          <TrendChart data={a.series} series={[{ key: "activeAstrologers", label: "Active astrologers", color: 2 }]} compare={range.compare} />
        </ChartCard>
      </Grid>
    </ViewStack>
  );
}
