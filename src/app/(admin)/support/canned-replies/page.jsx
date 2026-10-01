import { checkAccess } from "@/lib/session";
import { getCannedReplies } from "@/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { CannedReplies } from "../_components/CannedReplies";

export const metadata = { title: "Canned replies" };

export default async function CannedRepliesPage() {
  const { denied } = await checkAccess("support");
  if (denied) return denied;

  const replies = await getCannedReplies();

  return (
    <>
      <PageHeader back={{ href: "/support", label: "Ticket inbox" }} title="Canned replies" description="Saved answers agents can insert into a ticket reply." />
      <CannedReplies initial={replies} />
    </>
  );
}
