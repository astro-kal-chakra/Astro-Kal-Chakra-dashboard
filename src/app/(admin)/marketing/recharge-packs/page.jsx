import { checkAccess } from "@/lib/session";
import { getMarketing } from "@/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { PackManager } from "../_components/PackManager";

export const metadata = { title: "Recharge packs" };

export default async function RechargePacksPage() {
  const { denied } = await checkAccess("marketing");
  if (denied) return denied;

  const { packs } = await getMarketing();

  return (
    <>
      <PageHeader title="Recharge packs" description="Wallet top-up options and bonus credit shown on the recharge screen." />
      <PackManager initial={packs} />
    </>
  );
}
