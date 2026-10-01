import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { TrendChart, BarChart } from "@/components/charts/Charts";
import { ChartCard, Grid, KpiRow, SectionTitle, ViewStack } from "./ChartCard";

export function EngagementView({ a }) {
  const { totals: t, change: c, range } = a;
  return (
    <ViewStack>
      <SectionTitle>Push notifications</SectionTitle>
      <KpiRow
        items={[
          { label: "Push sent", value: formatNumber(t.pushSent, true), change: c.pushSent, href: "/marketing/push" },
          { label: "Push opened", value: formatNumber(t.pushOpened, true), change: c.pushOpened },
          { label: "Open rate", value: formatPercent(t.pushOpenRate), change: c.pushOpenRate },
        ]}
      />
      <Grid>
        {/* Sent and opened differ by ~10×, so they get separate charts rather than a dual axis. */}
        <ChartCard title="Push sent" description={`Per ${range.group}`}>
          <BarChart data={a.series} series={[{ key: "pushSent", label: "Sent" }]} href="/marketing/push" />
        </ChartCard>
        <ChartCard title="Push open rate" description="% of delivered pushes opened">
          <TrendChart data={a.series} series={[{ key: "pushOpenRate", label: "Open rate", color: 1 }]} format="percent" compare={range.compare} />
        </ChartCard>
      </Grid>

      <SectionTitle>Referrals</SectionTitle>
      <KpiRow
        items={[
          { label: "Referral signups", value: formatNumber(t.referralSignups), change: c.referralSignups, href: "/marketing/referrals" },
          { label: "Rewards paid", value: formatCurrency(t.referralRewards, true), change: c.referralRewards },
          { label: "Cost per referral signup", value: formatCurrency(t.referralSignups ? t.referralRewards / t.referralSignups : 0), hint: range.label },
        ]}
      />
      <Grid>
        <ChartCard title="Referral signups" description={`Per ${range.group}`}>
          <TrendChart data={a.series} series={[{ key: "referralSignups", label: "Signups", color: 2 }]} compare={range.compare} />
        </ChartCard>
        <ChartCard title="Referral rewards paid" description={`Per ${range.group}`}>
          <BarChart data={a.series} series={[{ key: "referralRewards", label: "Rewards", color: 4 }]} format="currency" />
        </ChartCard>
      </Grid>
    </ViewStack>
  );
}
