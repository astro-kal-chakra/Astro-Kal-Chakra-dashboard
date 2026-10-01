"use client";

import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn, formatCurrency, formatDuration, formatNumber, formatPercent } from "@/lib/utils";

/**
 * Chart kit. Series colours come from the validated --series-N tokens in a
 * fixed order (identity never depends on rank). Formatters are passed by
 * name so server components can configure charts.
 */
export const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

const FORMATS = {
  number: (v) => formatNumber(v),
  compact: (v) => formatNumber(v, true),
  currency: (v) => formatCurrency(v),
  currencyCompact: (v) => formatCurrency(v, true),
  percent: (v) => formatPercent(v),
  duration: (v) => formatDuration(v),
  minutes: (v) => `${formatNumber(Math.round(v))} min`,
  hours: (v) => `${(+v).toFixed(1)} h`,
  rating: (v) => `${(+v).toFixed(2)} ★`,
};
const fmt = (name) => FORMATS[name] ?? FORMATS.number;
const axisFmt = (name) => (name === "currency" || name === "currencyCompact" ? FORMATS.currencyCompact : name === "percent" ? (v) => `${v}%` : name === "number" ? FORMATS.compact : fmt(name));

const axisProps = {
  tick: { fill: "var(--muted)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

export function Legend({ items, className }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-2", className)}>
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span
            className={cn("inline-block shrink-0", it.dashed ? "h-0 w-3.5 border-t-2 border-dashed" : "size-2.5 rounded-[3px]")}
            style={it.dashed ? { borderColor: it.color } : { background: it.color }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({ active, payload, label, format, labelFormat }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs shadow-pop">
      <p className="mb-1.5 font-semibold text-text">{labelFormat ? labelFormat(label) : label}</p>
      <ul className="space-y-1">
        {payload.map((p) => (
          <li key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-text-2">
              <span className="size-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
              {p.name}
            </span>
            <span className="font-semibold text-text tabular-nums">{fmt(format)(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Line/area trend. `compare` overlays `prev_<key>` as a dashed line.
 * `href` makes points clickable (opens the filtered list).
 */
export function TrendChart({ data, series, xKey = "label", height = 260, format = "number", compare, area = true, href, className }) {
  const router = useRouter();
  const legend = series.flatMap((s, i) => [
    { label: s.label, color: SERIES[s.color ?? i] },
    ...(compare ? [{ label: `${s.label} (prev.)`, color: SERIES[s.color ?? i], dashed: true }] : []),
  ]);
  const showLegend = series.length > 1 || compare;

  return (
    <div className={className}>
      {showLegend && <Legend items={legend} className="mb-3" />}
      <div style={{ height }} className={cn(href && "cursor-pointer")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, left: -8, bottom: 0 }} onClick={href ? () => router.push(href) : undefined}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={SERIES[s.color ?? i]} stopOpacity={area ? 0.18 : 0} />
                  <stop offset="1" stopColor={SERIES[s.color ?? i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey={xKey} {...axisProps} minTickGap={24} />
            <YAxis {...axisProps} tickFormatter={axisFmt(format)} width={56} />
            <Tooltip content={<ChartTooltip format={format} />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} />
            {compare &&
              series.map((s, i) => (
                <Line
                  key={`prev_${s.key}`}
                  dataKey={`prev_${s.key}`}
                  name={`${s.label} (prev.)`}
                  stroke={SERIES[s.color ?? i]}
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                  type="monotone"
                  isAnimationActive={false}
                />
              ))}
            {series.map((s, i) => (
              <Area
                key={s.key}
                dataKey={s.key}
                name={s.label}
                type="monotone"
                stroke={SERIES[s.color ?? i]}
                strokeWidth={2}
                fill={`url(#g-${s.key})`}
                dot={false}
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: "var(--surface)" }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Vertical or horizontal bars. `stacked` stacks series. */
export function BarChart({ data, series, xKey = "label", height = 260, format = "number", horizontal, stacked, href, className, categoryWidth = 96 }) {
  const router = useRouter();
  const showLegend = series.length > 1;
  const radius = horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];

  return (
    <div className={className}>
      {showLegend && <Legend items={series.map((s, i) => ({ label: s.label, color: SERIES[s.color ?? i] }))} className="mb-3" />}
      <div style={{ height }} className={cn(href && "cursor-pointer")}>
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart
            data={data}
            layout={horizontal ? "vertical" : "horizontal"}
            margin={{ top: 6, right: 8, left: horizontal ? 0 : -8, bottom: 0 }}
            barGap={2}
            barCategoryGap={horizontal ? "28%" : "22%"}
            onClick={href ? () => router.push(href) : undefined}
          >
            <CartesianGrid stroke="var(--grid)" vertical={horizontal} horizontal={!horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" {...axisProps} tickFormatter={axisFmt(format)} />
                <YAxis type="category" dataKey={xKey} {...axisProps} width={categoryWidth} tick={{ fill: "var(--text-2)", fontSize: 12 }} />
              </>
            ) : (
              <>
                <XAxis dataKey={xKey} {...axisProps} minTickGap={12} />
                <YAxis {...axisProps} tickFormatter={axisFmt(format)} width={56} />
              </>
            )}
            <Tooltip content={<ChartTooltip format={format} />} cursor={{ fill: "var(--surface-3)", opacity: 0.6 }} />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={SERIES[s.color ?? i]}
                stackId={stacked ? "a" : undefined}
                radius={stacked && i < series.length - 1 ? 0 : radius}
                stroke="var(--surface)"
                strokeWidth={stacked ? 1 : 0}
                maxBarSize={horizontal ? 18 : 36}
                isAnimationActive={false}
              />
            ))}
          </RBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Donut for part-to-whole splits (≤5 slices). Always paired with a labelled legend. */
export function DonutChart({ data, format = "number", height = 200, centerLabel = "Total", href, className }) {
  const router = useRouter();
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      <div className={cn("relative shrink-0", href && "cursor-pointer")} style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip format={format} />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="66%"
              outerRadius="100%"
              paddingAngle={1.5}
              stroke="var(--surface)"
              strokeWidth={2}
              isAnimationActive={false}
              onClick={href ? () => router.push(href) : undefined}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={SERIES[i % SERIES.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-muted">{centerLabel}</span>
          <span className="text-lg font-extrabold text-text tabular-nums">{fmt(format === "currency" ? "currencyCompact" : "compact")(total)}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-text-2">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: SERIES[i % SERIES.length] }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="shrink-0 text-right tabular-nums">
              <span className="font-semibold text-text">{fmt(format)(d.value)}</span>
              <span className="ml-1.5 text-xs text-muted">{total ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tiny inline trend for stat tiles; no axes, no hover. */
export function Sparkline({ data, dataKey, color = 0, height = 36 }) {
  return (
    <div style={{ height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={SERIES[color]} stopOpacity={0.2} />
              <stop offset="1" stopColor={SERIES[color]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area dataKey={dataKey} type="monotone" stroke={SERIES[color]} strokeWidth={1.75} fill={`url(#spark-${dataKey})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
