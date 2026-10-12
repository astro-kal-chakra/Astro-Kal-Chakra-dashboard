"use client";

import { useState } from "react";
import Link from "next/link";
import { Banknote, Check, CheckCheck, Loader, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionButton } from "@/components/common/ActionButton";
import { useAdmin } from "@/providers/AdminProvider";
import { Field, Input } from "@/components/ui/Input";
import { approvePayout, bulkApprovePayouts, markPayoutPaid, markPayoutProcessing, rejectPayout } from "@/actions/payments";

/**
 * Payout list with row selection for bulk approve, plus the bank-transfer steps
 * (approved → processing → paid with UTR). The backend re-checks payouts:approve /
 * payouts:edit on every call and audit-logs each decision.
 */
const ACTION_TABS = ["requested", "approved", "processing"];

export function PayoutTable({ rows, status }) {
  const { can } = useAdmin();
  const [selected, setSelected] = useState(() => new Set());
  const [decided, setDecided] = useState({});

  const selectable = status === "requested" && can("payouts", "approve");
  const open = rows.filter((r) => !decided[r.id]);
  const allChecked = open.length > 0 && open.every((r) => selected.has(r.id));
  const selectedRows = rows.filter((r) => selected.has(r.id) && !decided[r.id]);
  const selectedNet = selectedRows.reduce((s, r) => s + r.net, 0);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(open.map((r) => r.id)));
  const decide = (ids, outcome) => {
    setDecided((d) => ({ ...d, ...Object.fromEntries(ids.map((id) => [id, outcome])) }));
    setSelected(new Set());
  };

  if (!rows.length) return <EmptyState title="No payouts here" description="Try another tab or search." />;

  return (
    <>
      {selectable && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-2 px-4 py-2.5">
          <p className="text-xs text-muted">
            {selectedRows.length ? (
              <>
                <span className="font-semibold text-text-2">{selectedRows.length} selected</span> · {formatCurrency(selectedNet)} net
              </>
            ) : (
              "Select payouts to approve them together"
            )}
          </p>
          <ActionButton
            module="payouts"
            action="approve"
            confirm
            size="xs"
            variant="success"
            icon={<CheckCheck />}
            disabled={!selectedRows.length}
            dialogTitle={`Approve ${selectedRows.length} payouts`}
            dialogDescription={`${formatCurrency(selectedNet)} net goes to bank transfer. Each approval is audit-logged.`}
            confirmLabel="Approve all"
            success="Payouts approved"
            successDescription={(d) => (d ? `${d.approved} approved${d.results?.some((x) => !x.ok) ? ` · ${d.results.filter((x) => !x.ok).length} could not be approved` : ""}` : undefined)}
            run={() => bulkApprovePayouts(selectedRows.map((r) => r.id))}
            onDone={(_, __, d) => decide(d?.results?.filter((x) => x.ok).map((x) => x.id) ?? selectedRows.map((r) => r.id), "approved")}
          >
            Approve selected
          </ActionButton>
        </div>
      )}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs font-semibold tracking-wide text-muted uppercase">
              {selectable && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" aria-label="Select all" checked={allChecked} onChange={toggleAll} className="size-4 accent-primary" />
                </th>
              )}
              <th className="px-4 py-2.5">Astrologer</th>
              <th className="px-4 py-2.5 max-md:hidden">Period</th>
              <th className="px-4 py-2.5 text-right">Gross</th>
              <th className="px-4 py-2.5 text-right">Platform charge</th>
              <th className="px-4 py-2.5 text-right max-md:hidden">TDS (1%)</th>
              <th className="px-4 py-2.5 text-right">Net</th>
              <th className="px-4 py-2.5 max-md:hidden">Bank</th>
              <th className="px-4 py-2.5">{status === "paid" ? "UTR" : "Status"}</th>
              {ACTION_TABS.includes(status) && (
                <th className="px-4 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => {
              const outcome = decided[p.id];
              return (
                <tr key={p.id} className="text-text-2 whitespace-nowrap">
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.id}`}
                        checked={selected.has(p.id)}
                        disabled={Boolean(outcome)}
                        onChange={() => toggle(p.id)}
                        className="size-4 accent-primary"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Link href={`/astrologers/${p.astrologerId}`} className="font-semibold text-text hover:text-primary">
                      {p.astrologerName}
                    </Link>
                    <p className="font-mono text-xs text-muted">
                      {p.id} · {p.requestedLabel}
                    </p>
                  </td>
                  <td className="px-4 py-3 max-md:hidden">{p.period}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(p.gross)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    −{formatCurrency(p.commission)}
                    <span className="block text-xs text-muted">{p.commissionRate}%</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums max-md:hidden">−{formatCurrency(p.tds)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-text tabular-nums">{formatCurrency(p.net)}</td>
                  <td className="px-4 py-3 font-mono text-xs max-md:hidden">{p.bank}</td>
                  <td className="px-4 py-3">
                    {p.status === "paid" && p.utr ? (
                      <span className="font-mono text-xs text-text">{p.utr}</span>
                    ) : (
                      <StatusBadge status={outcome ?? p.status} />
                    )}
                  </td>
                  {status === "requested" && (
                    <td className="px-4 py-3">
                      {!outcome && (
                        <div className="flex items-center gap-1.5">
                          <ActionButton
                            module="payouts"
                            action="approve"
                            confirm
                            size="xs"
                            variant="success"
                            icon={<Check />}
                            dialogTitle={`Approve payout ${p.id}`}
                            dialogDescription={`${formatCurrency(p.net)} net to ${p.astrologerName} (${p.bank}).`}
                            confirmLabel="Approve payout"
                            success="Payout approved"
                            run={() => approvePayout(p.id)}
                            onDone={() => decide([p.id], "approved")}
                          >
                            Approve
                          </ActionButton>
                          <ActionButton
                            module="payouts"
                            action="approve"
                            reason
                            size="xs"
                            variant="danger-soft"
                            icon={<X />}
                            dialogTitle={`Reject payout ${p.id}`}
                            dialogDescription="The astrologer sees your reason. Earnings stay in their balance."
                            confirmLabel="Reject payout"
                            success="Payout rejected"
                            run={(why) => rejectPayout(p.id, why)}
                            onDone={() => decide([p.id], "rejected")}
                          >
                            Reject
                          </ActionButton>
                        </div>
                      )}
                    </td>
                  )}
                  {status === "approved" && (
                    <td className="px-4 py-3">
                      {!outcome && (
                        <ActionButton
                          module="payouts"
                          action="edit"
                          confirm
                          size="xs"
                          icon={<Loader />}
                          dialogTitle={`Mark ${p.id} processing`}
                          dialogDescription={`The bank transfer of ${formatCurrency(p.net)} to ${p.astrologerName} has been started.`}
                          confirmLabel="Mark processing"
                          success="Marked processing"
                          run={() => markPayoutProcessing(p.id)}
                          onDone={() => decide([p.id], "processing")}
                        >
                          Processing
                        </ActionButton>
                      )}
                    </td>
                  )}
                  {status === "processing" && (
                    <td className="px-4 py-3">
                      {!outcome && (
                        <ActionButton
                          module="payouts"
                          action="edit"
                          reason
                          reasons={["Bank transfer completed", "Paid manually by Finance"]}
                          size="xs"
                          variant="success"
                          icon={<Banknote />}
                          dialogTitle={`Mark ${p.id} paid`}
                          dialogDescription={`${formatCurrency(p.net)} to ${p.astrologerName} (${p.bank}). Enter the UTR from the bank.`}
                          confirmLabel="Mark paid"
                          success="Marked paid"
                          run={(why, data) => markPayoutPaid(p.id, why, data)}
                          onDone={() => decide([p.id], "paid")}
                          fields={
                            <Field label="UTR / bank reference" htmlFor={`utr-${p.id}`}>
                              <Input id={`utr-${p.id}`} name="utr" required minLength={6} maxLength={40} placeholder="UTR2026100100001" className="font-mono" />
                            </Field>
                          }
                        >
                          Mark paid
                        </ActionButton>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
