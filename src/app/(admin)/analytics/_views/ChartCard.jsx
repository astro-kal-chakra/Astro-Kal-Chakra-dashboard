import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { cn } from "@/lib/utils";

export function ChartCard({ title, description, action, className, children }) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader title={title} description={description} action={action} />
      <CardBody>{children}</CardBody>
    </Card>
  );
}

/** Row of KPI tiles. items: [{ label, value, change?, invert?, hint?, href? }] */
export function KpiRow({ items }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
      {items.map((it) => (
        <StatCard key={it.label} {...it} hint={it.hint ?? "vs previous period"} />
      ))}
    </div>
  );
}

export function Grid({ cols = 2, children }) {
  return <div className={cn("grid gap-4 lg:gap-5", cols === 2 && "lg:grid-cols-2", cols === 3 && "lg:grid-cols-3")}>{children}</div>;
}

export function ViewStack({ children }) {
  return <div className="space-y-4 lg:space-y-5">{children}</div>;
}

export function SectionTitle({ children }) {
  return <h2 className="pt-2 text-sm font-bold text-text">{children}</h2>;
}
