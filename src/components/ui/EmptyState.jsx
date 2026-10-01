import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({ icon, title = "Nothing here yet", description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-surface-3 text-muted [&_svg]:size-6">{icon ?? <Inbox />}</div>
      <p className="text-sm font-semibold text-text">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
