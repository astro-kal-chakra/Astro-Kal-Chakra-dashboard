import { checkAccess } from "@/lib/session";
import { getBlogs, getContent, getReports } from "@/services";
import { flatParams } from "@/lib/url";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TabLinks } from "@/components/ui/Tabs";
import { HoroscopeGrid } from "./_components/HoroscopeGrid";
import { BlogManager } from "./_components/BlogManager";
import { FaqManager } from "./_components/FaqManager";
import { PolicyManager } from "./_components/PolicyManager";
import { ReportManager } from "./_components/ReportManager";

export const metadata = { title: "Content" };

export default async function ContentPage({ searchParams }) {
  const { denied } = await checkAccess("content");
  if (denied) return denied;

  const sp = flatParams(await searchParams);
  // Articles are paged on the server; only the Blogs tab loads a page of them
  const [content, reports, blogs] = await Promise.all([getContent(), getReports(), sp.tab === "blogs" ? getBlogs(sp) : null]);
  const missing = content.horoscopes.filter((h) => h.status === "missing").length;

  const tabs = [
    { value: "horoscope", label: missing ? `Horoscopes · ${missing} missing today` : "Horoscopes" },
    { value: "blogs", label: "Blogs", count: content.blogCount },
    { value: "faqs", label: "FAQs", count: content.faqs.length },
    { value: "reports", label: "Reports", count: reports.length },
    { value: "policies", label: "Policy pages", count: content.policies.length },
  ];
  const tab = tabs.some((t) => t.value === sp.tab) ? sp.tab : "horoscope";

  return (
    <>
      <PageHeader title="Content" description="Horoscopes, articles, help, paid reports and legal pages shown in the app and on the website." />
      <Card className="mb-4 lg:mb-5">
        <TabLinks tabs={tabs} active={tab} basePath="/content" params={sp} className="px-2" />
      </Card>
      {tab === "horoscope" && <HoroscopeGrid initial={content.horoscopes} />}
      {tab === "blogs" && <BlogManager data={blogs} params={sp} />}
      {tab === "faqs" && <FaqManager initial={content.faqs} />}
      {tab === "reports" && <ReportManager initial={reports} />}
      {tab === "policies" && <PolicyManager initial={content.policies} />}
    </>
  );
}
