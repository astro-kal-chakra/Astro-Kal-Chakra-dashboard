import { checkAccess } from "@/lib/session";
import { getBanners } from "@/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { BannerManager } from "../_components/BannerManager";

export const metadata = { title: "Banners" };

export default async function BannersPage() {
  const { denied } = await checkAccess("marketing");
  if (denied) return denied;

  const banners = await getBanners();

  return (
    <>
      <PageHeader title="Banners" description="In-app banners on the home and wallet screens." />
      <BannerManager initial={banners} />
    </>
  );
}
