import { checkAccess } from "@/lib/session";
import { getMarketing } from "@/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { CouponManager } from "../_components/CouponManager";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const { denied } = await checkAccess("marketing");
  if (denied) return denied;

  const { coupons } = await getMarketing();

  return (
    <>
      <PageHeader title="Coupons" description="Recharge discount codes, limits and expiry." />
      <CouponManager initial={coupons} />
    </>
  );
}
