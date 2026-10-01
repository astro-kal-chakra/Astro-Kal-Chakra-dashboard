import { checkAccess } from "@/lib/session";
import { getMarketing } from "@/services";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { MiniStat } from "@/components/ui/StatCard";
import { ReferralForm } from "../_components/ReferralForm";

export const metadata = { title: "Referral rules" };

export default async function ReferralsPage() {
  const { denied } = await checkAccess("marketing");
  if (denied) return denied;

  const { referral } = await getMarketing();
  const { stats, ...rules } = referral;

  return (
    <>
      <PageHeader title="Referral rules" description="Rewards for users who invite friends." />
      <div className="space-y-4 lg:space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniStat label="Referred signups" value={formatNumber(stats.signups)} accent />
          <MiniStat label="Rewards paid" value={formatCurrency(stats.rewardsPaid)} />
          <MiniStat label="Signup → reward" value={formatPercent(stats.conversion)} hint="Friends who hit the trigger" />
        </div>
        <div className="max-w-3xl">
          <ReferralForm rules={rules} />
        </div>
      </div>
    </>
  );
}
