import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCompactNumber } from "@/utils/format";

export function ConversionFunnel({
  data,
}: {
  data: { stage: string; value: number; pct: number }[];
}) {
  const max = data[0]?.pct || 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion funnel</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-3.5 p-5">
        {data.map((step, i) => (
          <div key={step.stage}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-body">{step.stage}</span>
              <span className="font-semibold text-foreground">
                {formatCompactNumber(step.value)}{" "}
                <span className="font-normal text-muted">({step.pct}%)</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.max((step.pct / max) * 100, 3)}%`,
                  opacity: 1 - i * 0.15,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
