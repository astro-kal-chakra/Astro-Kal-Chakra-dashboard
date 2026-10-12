import { checkAccess } from "@/lib/session";
import { getCoupons } from "@/services";
import { flatParams } from "@/lib/url";
import { PageHeader } from "@/components/ui/PageHeader";
import { CouponManager } from "../_components/CouponManager";

export const metadata = { title: "Coupons" };

export default async function CouponsPage({ searchParams }) {
  const { denied } = await checkAccess("marketing");
  if (denied) return denied;

  const params = flatParams(await searchParams);
  const data = await getCoupons(params);

  return (
    <>
      <PageHeader title="Coupons" description="Recharge discount codes, limits and expiry." />
      <CouponManager data={data} params={params} />
    </>
  );
}
