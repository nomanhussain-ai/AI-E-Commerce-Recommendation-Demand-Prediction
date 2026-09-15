import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

export function StatCard({
  label,
  value,
  deltaPct,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  deltaPct: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "info" | "danger";
}) {
  const positive = deltaPct >= 0;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted">{label}</div>
          <div className="mt-1.5 text-2xl font-bold text-foreground">{value}</div>
        </div>
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
            tone === "primary" && "bg-primary-soft text-primary-hover",
            tone === "success" && "bg-success-soft text-success",
            tone === "warning" && "bg-warning-soft text-warning",
            tone === "info" && "bg-info-soft text-info",
            tone === "danger" && "bg-danger-soft text-danger",
          )}
        >
          <Icon size={19} />
        </span>
      </div>

      <div
        className={cn(
          "mt-3 flex items-center gap-1 text-xs font-semibold",
          positive ? "text-success" : "text-danger",
        )}
      >
        {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {formatPercent(deltaPct, { signed: true })}
        <span className="font-normal text-muted">vs last week</span>
      </div>
    </Card>
  );
}
