import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, back, meta, className }) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:mb-6", className)}>
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text">
            <ArrowLeft className="size-3.5" />
            {back.label}
          </Link>
        )}
        <h1 className="text-xl font-extrabold tracking-tight text-text sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
