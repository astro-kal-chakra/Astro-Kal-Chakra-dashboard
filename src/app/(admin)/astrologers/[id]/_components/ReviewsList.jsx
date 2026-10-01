"use client";

import { useState } from "react";
import { Eye, EyeOff, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionButton } from "@/components/common/ActionButton";
import { cn, timeAgo } from "@/lib/utils";

/** Review moderation. Hide/unhide is permission-checked here and on the backend. */
export function ReviewsList({ reviews: initial }) {
  const [reviews, setReviews] = useState(initial);
  if (!reviews.length) return <EmptyState title="No reviews yet" description="Reviews appear after users rate a session." />;

  const toggle = (id) => setReviews((list) => list.map((r) => (r.id === id ? { ...r, hidden: !r.hidden } : r)));

  return (
    <ul className="divide-y divide-border">
      {reviews.map((r) => (
        <li key={r.id} className={cn("flex items-start gap-3 px-4 py-3 sm:px-5", r.hidden && "bg-surface-2")}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-text">{r.userName}</span>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-warning" aria-label={`${r.rating} stars`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={cn("size-3.5", i < r.rating ? "fill-current" : "text-border-strong")} />
                ))}
              </span>
              <span className="text-xs text-muted">{timeAgo(r.at)}</span>
              {r.hidden && <Badge tone="warning">Hidden from app</Badge>}
            </div>
            <p className={cn("mt-1 text-sm", r.hidden ? "text-muted line-through" : "text-text-2")}>{r.text}</p>
          </div>
          {r.hidden ? (
            <ActionButton module="astrologers" size="xs" variant="ghost" icon={<Eye />} confirm dialogTitle="Unhide review" dialogDescription="The review shows on the astrologer's profile again." confirmLabel="Unhide" success="Review visible again" onDone={() => toggle(r.id)}>
              Unhide
            </ActionButton>
          ) : (
            <ActionButton module="astrologers" size="xs" variant="ghost" icon={<EyeOff />} confirm dialogTitle="Hide review" dialogDescription="The review is hidden from the app. The rating still counts." confirmLabel="Hide review" success="Review hidden" onDone={() => toggle(r.id)}>
              Hide
            </ActionButton>
          )}
        </li>
      ))}
    </ul>
  );
}
