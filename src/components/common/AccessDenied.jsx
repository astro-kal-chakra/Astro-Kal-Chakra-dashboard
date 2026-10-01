import { Lock } from "lucide-react";
import { MODULES } from "@/config/permissions";
import { Button } from "@/components/ui/Button";

export default function AccessDenied({ module, roleName }) {
  const label = MODULES.find((m) => m.key === module)?.label ?? module;
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <Lock className="size-6" />
      </div>
      <h1 className="text-lg font-bold text-text">You don&apos;t have access to {label}</h1>
      <p className="mt-1 max-w-md text-sm text-muted">
        Your role <span className="font-semibold text-text-2">{roleName}</span> can&apos;t view this page. Ask a Super Admin to update your
        permissions if you need it.
      </p>
      <Button href="/" variant="primary" className="mt-5">
        Back to overview
      </Button>
    </div>
  );
}
