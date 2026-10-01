import { checkAccess } from "@/lib/session";
import { getAnalytics } from "@/services/analytics";
import { flatParams } from "@/lib/url";
import { PageHeader } from "@/components/ui/PageHeader";
import { TabLinks } from "@/components/ui/Tabs";
import { DateRangeFilter } from "@/components/charts/DateRangeFilter";
import { ExportButton } from "@/components/common/ExportButton";
import { derive } from "./_views/derive";
import { UsersView } from "./_views/UsersView";
import { AstrologersView } from "./_views/AstrologersView";
import { SessionsView } from "./_views/SessionsView";
import { RevenueView } from "./_views/RevenueView";
import { FunnelView } from "./_views/FunnelView";
import { TopListsView } from "./_views/TopListsView";
import { SupportQualityView } from "./_views/SupportQualityView";
import { EngagementView } from "./_views/EngagementView";

export const metadata = { title: "Analytics" };

const VIEWS = [
  { value: "users", label: "Users", component: UsersView },
  { value: "astrologers", label: "Astrologers", component: AstrologersView },
  { value: "sessions", label: "Chats & calls", component: SessionsView },
  { value: "revenue", label: "Revenue", component: RevenueView },
  { value: "funnel", label: "Free chat & queue", component: FunnelView },
  { value: "top", label: "Top lists", component: TopListsView },
  { value: "support", label: "Support & quality", component: SupportQualityView },
  { value: "engagement", label: "Notifications & referrals", component: EngagementView },
];

export default async function AnalyticsPage({ searchParams }) {
  const { denied } = await checkAccess("analytics");
  if (denied) return denied;

  const sp = flatParams(await searchParams);
  const view = VIEWS.find((v) => v.value === sp.view) ?? VIEWS[0];
  const raw = await getAnalytics({ preset: sp.preset ?? "30d", from: sp.from, to: sp.to, group: sp.group, compare: sp.compare });
  const a = derive(raw);
  const View = view.component;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Computed from daily stats pre-aggregated by a background job."
        actions={<ExportButton module="analytics" filename={`analytics-${view.value}-${a.range.preset}.csv`} rows={a.series} />}
      />
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-border bg-bg/90 px-4 pt-1 backdrop-blur-md sm:-mx-6 sm:px-6">
        <DateRangeFilter range={a.range} className="py-2" />
        <TabLinks tabs={VIEWS} active={view.value} param="view" basePath="/analytics" params={sp} />
      </div>
      <View a={a} />
    </>
  );
}
