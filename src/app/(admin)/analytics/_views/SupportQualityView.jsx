import { formatCurrency, formatNumber } from "@/lib/utils";
import { getQualityByAstrologer } from "@/services/topLists";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { PersonCell } from "@/components/ui/Avatar";
import { TrendChart, BarChart } from "@/components/charts/Charts";
import { ChartCard, Grid, KpiRow, SectionTitle, ViewStack } from "./ChartCard";

export async function SupportQualityView({ a }) {
  const { totals: t, change: c, range } = a;
  const complaints = await getQualityByAstrologer();

  return (
    <ViewStack>
      <SectionTitle>Support</SectionTitle>
      <KpiRow
        items={[
          { label: "Tickets opened", value: formatNumber(t.ticketsOpened), change: c.ticketsOpened, invert: true, href: "/support" },
          { label: "Tickets resolved", value: formatNumber(t.ticketsResolved), change: c.ticketsResolved, href: "/support?status=resolved" },
          { label: "Avg resolution time", value: `${t.avgResolutionHrs.toFixed(1)} h`, change: c.avgResolutionHrs, invert: true },
          { label: "Refund amount", value: formatCurrency(t.refundAmount, true), change: c.refundAmount, invert: true, href: "/payments/refunds" },
        ]}
      />
      <Grid>
        <ChartCard title="Tickets opened vs resolved" description={`Per ${range.group}`}>
          <BarChart
            data={a.series}
            series={[
              { key: "ticketsOpened", label: "Opened", color: 1 },
              { key: "ticketsResolved", label: "Resolved", color: 2 },
            ]}
            href="/support"
          />
        </ChartCard>
        <ChartCard title="Average resolution time" description="Hours from open to resolved">
          <TrendChart data={a.series} series={[{ key: "avgResolutionHrs", label: "Resolution time", color: 4 }]} format="hours" compare={range.compare} />
        </ChartCard>
        <ChartCard title="Refund amount" description={`Per ${range.group}`} className="lg:col-span-2">
          <TrendChart data={a.series} series={[{ key: "refundAmount", label: "Refunds" }]} format="currency" compare={range.compare} href="/payments/refunds" height={220} />
        </ChartCard>
      </Grid>

      <SectionTitle>Quality</SectionTitle>
      <KpiRow
        items={[
          { label: "Average rating", value: `${t.avgRating.toFixed(2)} ★`, change: c.avgRating },
          { label: "Complaints", value: formatNumber(t.complaints), change: c.complaints, invert: true },
          { label: "Flagged chats", value: formatNumber(t.flaggedChats), change: c.flaggedChats, invert: true, href: "/chats/flagged" },
        ]}
      />
      <Grid>
        <ChartCard title="Average rating" description="Post-session ratings">
          <TrendChart data={a.series} series={[{ key: "avgRating", label: "Rating", color: 3 }]} format="rating" compare={range.compare} />
        </ChartCard>
        <ChartCard title="Flagged chats" description="Auto-flagged messages per period">
          <BarChart data={a.series} series={[{ key: "flaggedChats", label: "Flagged", color: 1 }]} href="/chats/flagged" />
        </ChartCard>
      </Grid>
      <Card>
        <CardHeader title="Complaints per astrologer" description="Highest complaint rate per 1,000 sessions" />
        <DataTable
          dense
          rows={complaints}
          rowHref={(r) => `/astrologers/${r.id}`}
          columns={[
            { key: "name", label: "Astrologer", render: (r) => <PersonCell name={r.name} sub={r.id} /> },
            { key: "complaints", label: "Complaints", align: "right" },
            { key: "perThousand", label: "Per 1,000 sessions", align: "right", render: (r) => <span className="font-bold text-text">{r.perThousand}</span> },
            { key: "rating", label: "Rating", align: "right", render: (r) => `${r.rating} ★` },
          ]}
        />
      </Card>
    </ViewStack>
  );
}
