import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { TrendChart, BarChart, DonutChart } from "@/components/charts/Charts";
import { ChartCard, Grid, KpiRow, ViewStack } from "./ChartCard";

export function RevenueView({ a }) {
  const { totals: t, change: c, range } = a;
  return (
    <ViewStack>
      <KpiRow
        items={[
          { label: "Gross revenue", value: formatCurrency(t.revenue, true), change: c.revenue, href: "/payments?status=success" },
          { label: "Commission earned", value: formatCurrency(t.commission, true), change: c.commission },
          { label: "Astrologer payout share", value: formatCurrency(t.payoutShare, true), change: c.payoutShare, href: "/payouts" },
          { label: "Recharge amount", value: formatCurrency(t.rechargeAmount, true), change: c.rechargeAmount, href: "/payments" },
        ]}
      />
      <KpiRow
        items={[
          { label: "Recharges", value: formatNumber(t.recharges), change: c.recharges, href: "/payments" },
          { label: "Average recharge", value: formatCurrency(t.avgRecharge), change: c.avgRecharge },
          { label: "First-recharge conversion", value: formatPercent(t.firstRechargeRate), change: c.firstRechargeRate, hint: "of new signups" },
          { label: "Failed payments", value: formatNumber(t.failedPayments), change: c.failedPayments, invert: true, href: "/payments?status=failed" },
        ]}
      />
      <Grid cols={3}>
        <ChartCard title="Gross revenue" description={`Per ${range.group}`} className="lg:col-span-2">
          <TrendChart data={a.series} series={[{ key: "revenue", label: "Revenue" }]} format="currency" compare={range.compare} href="/payments?status=success" />
        </ChartCard>
        <ChartCard title="Where revenue goes" description={range.label}>
          <DonutChart
            format="currency"
            centerLabel="Gross"
            data={[
              { name: "Astrologer payouts", value: t.payoutShare },
              { name: "Commission earned", value: t.commission },
            ]}
          />
        </ChartCard>
      </Grid>
      <Grid>
        <ChartCard title="Payout share vs commission" description="Stacked to gross revenue">
          <BarChart
            data={a.series}
            stacked
            format="currency"
            series={[
              { key: "payoutShare", label: "Payout share" },
              { key: "commission", label: "Commission", color: 1 },
            ]}
          />
        </ChartCard>
        <ChartCard title="Recharge amount" description={`Per ${range.group}`}>
          <TrendChart data={a.series} series={[{ key: "rechargeAmount", label: "Recharge amount", color: 2 }]} format="currency" compare={range.compare} href="/payments" />
        </ChartCard>
        <ChartCard title="Average recharge" description="Rupees per recharge">
          <TrendChart data={a.series} series={[{ key: "avgRecharge", label: "Average recharge", color: 4 }]} format="currency" compare={range.compare} />
        </ChartCard>
        <ChartCard title="First-recharge conversion" description="% of new signups who recharged">
          <TrendChart data={a.series} series={[{ key: "firstRechargeRate", label: "Conversion", color: 1 }]} format="percent" compare={range.compare} />
        </ChartCard>
      </Grid>
    </ViewStack>
  );
}
