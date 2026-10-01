"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";

const PREVIEW = 10;

/** Per-minute billing rows, collapsed to the first 10 until "Show all". */
export function BillingTable({ rows }) {
  const [all, setAll] = useState(false);
  if (!rows.length) return <EmptyState title="No billed minutes" description="This session never started billing." />;

  const shown = all ? rows : rows.slice(0, PREVIEW);
  const total = rows.reduce((s, r) => s + r.rate, 0);

  return (
    <>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs font-semibold tracking-wide text-muted uppercase">
              <th scope="col" className="px-4 py-2.5">Minute</th>
              <th scope="col" className="px-4 py-2.5 text-right">Charged</th>
              <th scope="col" className="px-4 py-2.5 text-right">Wallet after</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((r) => (
              <tr key={r.minute}>
                <td className="px-4 py-2 text-text-2 tabular-nums">#{r.minute}</td>
                <td className="px-4 py-2 text-right tabular-nums text-text">{r.rate ? formatCurrency(r.rate) : <span className="text-info">Free</span>}</td>
                <td className="px-4 py-2 text-right tabular-nums text-text-2">{formatCurrency(r.balanceAfter)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-surface-2 text-sm font-semibold">
              <td className="px-4 py-2.5 text-text">{rows.length} min</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-text">{formatCurrency(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      {rows.length > PREVIEW && (
        <div className="flex justify-center border-t border-border p-2">
          <Button variant="ghost" size="sm" icon={all ? <ChevronUp /> : <ChevronDown />} onClick={() => setAll((v) => !v)}>
            {all ? "Show first 10" : `Show all ${rows.length} minutes`}
          </Button>
        </div>
      )}
    </>
  );
}
