import { formatCurrency, formatNumber } from "@/lib/utils";
import { getTopAstrologers } from "@/services/topLists";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/Table";
import { PersonCell } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BarChart } from "@/components/charts/Charts";
import { ChartCard, Grid, ViewStack } from "./ChartCard";

const RANKS = [
  { value: "earnings", label: "Earnings" },
  { value: "sessions", label: "Sessions" },
  { value: "rating", label: "Rating" },
];

const rankCell = (_, i) => <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface-3 text-xs font-bold text-text-2">{i + 1}</span>;

export async function TopListsView({ a }) {
  // Three rankings, each a proper server sort (not a re-sort of one list).
  const [byEarnings, bySessions, byRating] = await Promise.all(RANKS.map((r) => getTopAstrologers({ by: r.value, limit: 10 })));
  const lists = { earnings: byEarnings, sessions: bySessions, rating: byRating };

  const astroColumns = (highlight) => [
    { key: "rank", label: "#", render: (r) => rankCell(r, lists[highlight].indexOf(r)) },
    { key: "name", label: "Astrologer", render: (r) => <PersonCell name={r.name} sub={r.city} /> },
    { key: "sessions", label: "Sessions", align: "right", render: (r) => <Strong on={highlight === "sessions"}>{formatNumber(r.sessions)}</Strong> },
    { key: "earnings", label: "Earnings", align: "right", render: (r) => <Strong on={highlight === "earnings"}>{formatCurrency(r.earnings)}</Strong> },
    { key: "rating", label: "Rating", align: "right", render: (r) => <Strong on={highlight === "rating"}>{r.rating} ★</Strong> },
    { key: "reviewsCount", label: "Reviews", align: "right", hideOnMobile: true, render: (r) => formatNumber(r.reviewsCount) },
  ];

  return (
    <ViewStack>
      <Grid>
        {RANKS.map((r) => (
          <Card key={r.value} className="min-w-0">
            <CardHeader title={`Top astrologers by ${r.label.toLowerCase()}`} description="All time · approved astrologers" />
            <DataTable dense rows={lists[r.value]} rowHref={(x) => `/astrologers/${x.id}`} columns={astroColumns(r.value)} />
          </Card>
        ))}
        <Card className="min-w-0">
          <CardHeader title="Top users by spend" description="Lifetime spend" />
          <DataTable
            dense
            rows={a.topUsers}
            rowHref={(u) => `/users/${u.id}`}
            columns={[
              { key: "rank", label: "#", render: (u) => rankCell(u, a.topUsers.indexOf(u)) },
              { key: "name", label: "User", render: (u) => <PersonCell name={u.name} sub={u.city} /> },
              { key: "sessionsCount", label: "Sessions", align: "right", render: (u) => formatNumber(u.sessionsCount) },
              { key: "totalSpend", label: "Spend", align: "right", render: (u) => <Strong on>{formatCurrency(u.totalSpend)}</Strong> },
            ]}
          />
        </Card>
      </Grid>

      <Grid>
        <ChartCard title="Best-selling recharge packs" description="Packs sold, all time">
          <BarChart
            horizontal
            data={a.topPacks.map((p) => ({ label: `₹${p.amount} → ₹${p.amount + p.bonus}`, sold: p.sold }))}
            series={[{ key: "sold", label: "Packs sold" }]}
            height={280}
            categoryWidth={110}
            href="/marketing/recharge-packs"
          />
        </ChartCard>
        <Card className="min-w-0">
          <CardHeader title="Recharge packs" description="Revenue contribution" />
          <DataTable
            dense
            rows={a.topPacks}
            columns={[
              { key: "label", label: "Pack", render: (p) => <span className="font-semibold text-text">{p.label}</span> },
              { key: "amount", label: "Pay → Get", render: (p) => `₹${p.amount} → ₹${p.amount + p.bonus}` },
              { key: "sold", label: "Sold", align: "right", render: (p) => formatNumber(p.sold) },
              { key: "revenue", label: "Revenue", align: "right", render: (p) => <Strong on>{formatCurrency(p.sold * p.amount)}</Strong> },
              { key: "active", label: "Status", render: (p) => (p.active ? <Badge tone="success" dot>Active</Badge> : <Badge dot>Inactive</Badge>) },
            ]}
          />
        </Card>
      </Grid>
    </ViewStack>
  );
}

function Strong({ on, children }) {
  return <span className={on ? "font-bold text-text" : undefined}>{children}</span>;
}
