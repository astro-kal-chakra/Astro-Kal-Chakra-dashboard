import { checkAccess } from "@/lib/session";
import { getAstroForm } from "@/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { AstroFormEditor } from "./_components/AstroFormEditor";

export const metadata = { title: "Astrologer registration form" };

export default async function AstroFormPage() {
  const { denied } = await checkAccess("settings");
  if (denied) return denied;
  const form = await getAstroForm();
  return (
    <>
      <PageHeader
        title="Astrologer registration form"
        description="What new astrologers fill in after OTP login: which fields show, which are required, your own extra fields, and the skills / languages / categories lists. The app uses the saved form right away."
      />
      <AstroFormEditor initial={form} />
    </>
  );
}
