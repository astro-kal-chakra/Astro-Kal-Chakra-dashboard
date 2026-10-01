"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Error({ reset }) {
  return (
    <EmptyState
      className="min-h-[60vh]"
      icon={<AlertTriangle />}
      title="Something went wrong"
      description="We couldn't load this page. Try again, and contact engineering if it keeps happening."
      action={<Button variant="primary" onClick={reset}>Try again</Button>}
    />
  );
}
