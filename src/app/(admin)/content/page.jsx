import { checkAccess } from "@/lib/session";
import { getContent } from "@/services";
import { flatParams } from "@/lib/url";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TabLinks } from "@/components/ui/Tabs";
import { HoroscopeGrid } from "./_components/HoroscopeGrid";
import { BlogManager } from "./_components/BlogManager";
import { FaqManager } from "./_components/FaqManager";
import { PolicyManager } from "./_components/PolicyManager";

export const metadata = { title: "Content" };

export default async function ContentPage({ searchParams }) {
  const { denied } = await checkAccess("content");
  if (denied) return denied;

  const sp = flatParams(await searchParams);
  const content = await getContent();
  const missing = content.horoscopes.filter((h) => h.status === "missing").length;

  const tabs = [
    { value: "horoscope", label: missing ? `Daily horoscope · ${missing} missing` : "Daily horoscope" },
    { value: "blogs", label: "Blogs", count: content.blogs.length },
    { value: "faqs", label: "FAQs", count: content.faqs.length },
    { value: "policies", label: "Policy pages", count: content.policies.length },
  ];
  const tab = tabs.some((t) => t.value === sp.tab) ? sp.tab : "horoscope";

  return (
    <>
      <PageHeader title="Content" description="Horoscopes, articles, help and legal pages shown in the app." />
      <Card className="mb-4 lg:mb-5">
        <TabLinks tabs={tabs} active={tab} basePath="/content" params={sp} className="px-2" />
      </Card>
      {tab === "horoscope" && <HoroscopeGrid initial={content.horoscopes} />}
      {tab === "blogs" && <BlogManager initial={content.blogs} />}
      {tab === "faqs" && <FaqManager initial={content.faqs} />}
      {tab === "policies" && <PolicyManager initial={content.policies} />}
    </>
  );
}
