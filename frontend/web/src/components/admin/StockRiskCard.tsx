import { AlertTriangle } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

const RISK_TONE: Record<"HIGH" | "MEDIUM" | "LOW", BadgeTone> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "success",
};

export function StockRiskCard({
  alerts,
}: {
  alerts: {
    product: string;
    sku: string;
    risk: "HIGH" | "MEDIUM" | "LOW";
    coverage: number;
    reorderQty: number;
  }[];
}) {
  const highCount = alerts.filter((a) => a.risk === "HIGH").length;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Forecast &amp; stock risk</CardTitle>
          <p className="mt-0.5 text-xs text-muted">30-day demand coverage Â· M2</p>
        </div>
        {highCount > 0 && (
          <Badge tone="danger" className="gap-1">
            <AlertTriangle size={12} /> {highCount} high risk
          </Badge>
        )}
      </CardHeader>

      <ul className="flex flex-col gap-1 p-3">
        {alerts.map((a) => (
          <li
            key={a.sku}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-muted"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{a.product}</div>
              <div className="truncate font-mono text-[0.7rem] text-muted">{a.sku}</div>
            </div>
            <div className="w-20 shrink-0">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    a.risk === "HIGH" && "bg-danger",
                    a.risk === "MEDIUM" && "bg-warning",
                    a.risk === "LOW" && "bg-success",
                  )}
                  style={{ width: `${Math.min(a.coverage * 100, 100)}%` }}
                />
              </div>
              <div className="mt-0.5 text-[0.65rem] text-muted">
                {Math.round(a.coverage * 100)}% covered
              </div>
            </div>
            <Badge tone={RISK_TONE[a.risk]}>{a.risk}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
