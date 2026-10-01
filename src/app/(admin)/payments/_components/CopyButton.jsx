"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/providers/ToastProvider";

/** Copies a gateway ID to the clipboard. */
export function CopyButton({ value, label = "ID" }) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  if (!value) return null;
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      icon={done ? <Check /> : <Copy />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
          toast(`${label} copied`, { description: value });
        } catch {
          toast("Could not copy", { type: "error", description: "Select the ID and copy it by hand." });
        }
      }}
    />
  );
}
