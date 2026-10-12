"use client";

import { useServerState } from "@/lib/useServerState";
import { useState } from "react";
import { Pause, Play, Plus } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Pagination } from "@/components/ui/Table";
import { FilterBar } from "@/components/common/FilterBar";
import { useToast } from "@/providers/ToastProvider";
import { useAdmin } from "@/providers/AdminProvider";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { toDateInput } from "./utils";
import { now } from "@/lib/clock";
import { activateCoupon, createCoupon, pauseCoupon } from "@/actions/marketing";

function UsageBar({ usage, limit }) {
  if (!limit) {
    return (
      <span className="text-xs text-text-2 tabular-nums">
        {formatNumber(usage)} <span className="text-muted">/ no limit</span>
      </span>
    );
  }
  const pct = Math.min(100, (usage / limit) * 100);
  return (
    <div className="w-36">
      <div className="mb-1 flex justify-between text-xs tabular-nums">
        <span className="font-semibold text-text">{formatNumber(usage)}</span>
        <span className="text-muted">/ {formatNumber(limit)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full rounded-full", pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CouponManager({ data, params }) {
  // One server page of coupons (search / page live in the URL)
  const [coupons, setCoupons] = useServerState(data.rows);
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState("percent");
  const [busy, setBusy] = useState(null);
  const toast = useToast();
  const { can } = useAdmin();
  // UI mirror of marketing:edit — the backend enforces the same check.
  const canEdit = can("marketing", "edit");

  const setStatus = async (c, status) => {
    setBusy(c.id);
    const r = status === "paused" ? await pauseCoupon(c.id) : await activateCoupon(c.id);
    setBusy(null);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    setCoupons((list) => list.map((x) => (x.id === c.id ? { ...x, status } : x)));
    toast(status === "paused" ? "Coupon paused" : "Coupon activated", { description: c.code });
  };

  const create = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    setBusy("form");
    const r = await createCoupon({ ...d, type });
    setBusy(null);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    if (r.data) setCoupons((list) => [r.data, ...list]);
    setCreating(false);
    setType("percent");
    toast("Coupon created", { description: `${d.code.trim().toUpperCase()} is now active.` });
  };

  const columns = [
    { key: "code", label: "Code", render: (c) => <span className="rounded-md bg-surface-3 px-2 py-1 font-mono text-xs font-bold tracking-wide text-text">{c.code}</span> },
    {
      key: "value",
      label: "Discount",
      render: (c) => (
        <span className="font-semibold text-text">
          {c.type === "percent" ? `${c.value}% off` : `${formatCurrency(c.value)} off`}
        </span>
      ),
    },
    { key: "maxDiscount", label: "Max discount", align: "right", hideOnMobile: true, render: (c) => (c.maxDiscount ? formatCurrency(c.maxDiscount) : "—") },
    { key: "minRecharge", label: "Min recharge", align: "right", hideOnMobile: true, render: (c) => formatCurrency(c.minRecharge) },
    { key: "usage", label: "Usage", render: (c) => <UsageBar usage={c.usage} limit={c.limit} /> },
    { key: "perUser", label: "Per user", align: "right", hideOnMobile: true, render: (c) => `${c.perUser}×` },
    { key: "status", label: "Status", render: (c) => <StatusBadge status={c.status} /> },
    {
      key: "expiresAt",
      label: "Expires",
      render: (c) => <span className={cn(c.status !== "expired" && c.expiresAt - now() < 7 * 86400000 && "font-semibold text-warning")}>{formatDate(c.expiresAt)}</span>,
    },
    ...(canEdit
      ? [
          {
            key: "actions",
            label: "",
            align: "right",
            render: (c) =>
              c.status === "active" ? (
                <Button size="xs" variant="ghost" icon={<Pause />} loading={busy === c.id} onClick={() => setStatus(c, "paused")}>
                  Pause
                </Button>
              ) : c.status === "paused" ? (
                <Button size="xs" variant="soft" icon={<Play />} loading={busy === c.id} onClick={() => setStatus(c, "active")}>
                  Activate
                </Button>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4">
          <p className="text-sm text-muted">
            {data.active ?? 0} active · {data.total} total
          </p>
          {canEdit && (
            <Button variant="primary" size="sm" icon={<Plus />} onClick={() => setCreating(true)}>
              Create coupon
            </Button>
          )}
        </div>
        <FilterBar searchPlaceholder="Search coupon code" />
        <DataTable columns={columns} rows={coupons} empty={{ title: params.q ? "No matching coupons" : "No coupons yet" }} />
        <Pagination {...data} basePath="/marketing/coupons" params={params} />
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Create coupon" description="Applied at recharge. Discount is credited to the wallet." size="lg">
        {creating && (
          <form onSubmit={create} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Code" htmlFor="cp-code" help="Letters and numbers, 4–16 characters.">
                <Input id="cp-code" name="code" required pattern="[A-Za-z0-9]{4,16}" placeholder="DIWALI20" className="font-mono uppercase" />
              </Field>
              <Field label="Type" htmlFor="cp-type">
                <Select
                  id="cp-type"
                  name="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  options={[{ value: "percent", label: "Percentage off" }, { value: "flat", label: "Flat amount off" }]}
                />
              </Field>
              <Field label={type === "percent" ? "Value (%)" : "Value (₹)"} htmlFor="cp-value">
                <Input id="cp-value" name="value" type="number" min="1" max={type === "percent" ? 100 : 5000} required placeholder={type === "percent" ? "20" : "100"} />
              </Field>
              {type === "percent" && (
                <Field label="Max discount (₹)" htmlFor="cp-max">
                  <Input id="cp-max" name="maxDiscount" type="number" min="1" required placeholder="250" />
                </Field>
              )}
              <Field label="Min recharge (₹)" htmlFor="cp-min">
                <Input id="cp-min" name="minRecharge" type="number" min="0" required placeholder="100" />
              </Field>
              <Field label="Total usage limit" htmlFor="cp-limit" hint="Blank = no limit">
                <Input id="cp-limit" name="limit" type="number" min="1" placeholder="10000" />
              </Field>
              <Field label="Uses per user" htmlFor="cp-per">
                <Input id="cp-per" name="perUser" type="number" min="1" max="10" defaultValue="1" required />
              </Field>
              <Field label="Expires on" htmlFor="cp-exp">
                <Input id="cp-exp" name="expiresAt" type="date" required min={toDateInput(now())} defaultValue={toDateInput(now() + 30 * 86400000)} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={busy === "form"}>
                Create coupon
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
