import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      className="min-h-[60vh]"
      icon={<SearchX />}
      title="Record not found"
      description="It may have been deleted, or the link is wrong."
      action={<Button href="/" variant="primary">Back to overview</Button>}
    />
  );
}
