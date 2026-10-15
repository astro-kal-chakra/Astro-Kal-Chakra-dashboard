import { checkAccess } from "@/lib/session";
import { getLeads } from "@/services";
import { flatParams } from "@/lib/url";
import { formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Table";
import { TabLinks } from "@/components/ui/Tabs";
import { FilterBar } from "@/components/common/FilterBar";
import { MarkSeen } from "@/components/common/MarkSeen";
import { LeadsTable } from "./_components/LeadsTable";

export const metadata = { title: "Enquiries" };

const TYPES = [
  { value: "contact", label: "Contact messages" },
  { value: "become_astrologer", label: "Astrologer applications" },
];
const STATUS_FILTER = {
  name: "status",
  label: "Any status",
  options: [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "closed", label: "Closed" },
  ],
};

/** Website "Contact us" messages and "Become an astrologer" applications (no account needed to send them). */
export default async function EnquiriesPage({ searchParams }) {
  const { denied } = await checkAccess("support");
  if (denied) return denied;

  const sp = flatParams(await searchParams);
  const type = TYPES.some((t) => t.value === sp.type) ? sp.type : "contact";
  const params = { ...sp, type };
  const data = await getLeads(params);
  const counts = data.counts ?? {};

  return (
    <>
      <MarkSeen section="leads" />
      <PageHeader
        title="Enquiries"
        description={
          type === "contact"
            ? `${formatNumber(data.total)} messages from the website's Contact us form`
            : `${formatNumber(data.total)} applications from the website's Become an astrologer form`
        }
      />
      <Card>
        <TabLinks tabs={TYPES.map((t) => ({ ...t, count: counts[t.value] ?? 0 }))} active={type} param="type" basePath="/enquiries" params={sp} className="px-2" />
        <FilterBar searchPlaceholder="Search name, email, phone or reference" filters={[STATUS_FILTER]} />
        <LeadsTable rows={data.rows ?? []} type={type} />
        <Pagination {...data} basePath="/enquiries" params={params} />
      </Card>
      <p className="mt-3 text-xs text-muted">Tab counts show new (not yet handled) enquiries. Mark one as Contacted or Closed once your team has followed up.</p>
    </>
  );
}
