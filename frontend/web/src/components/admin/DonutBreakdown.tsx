"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCompactNumber, formatCurrency } from "@/utils/format";

type Slice = { label: string; value: number; color: string };
type ValueFormat = "compact" | "currency";

export function DonutBreakdown({
  title,
  subtitle,
  data,
  format = "compact",
}: {
  title: string;
  subtitle?: string;
  data: Slice[];
  format?: ValueFormat;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const valueFormatter = format === "currency" ? formatCurrency : formatCompactNumber;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
      </CardHeader>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:items-center">
        <div className="relative h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((slice) => (
                  <Cell key={slice.label} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [valueFormatter(Number(value)), String(name)]}
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: "var(--shadow-card)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{valueFormatter(total)}</div>
              <div className="text-[0.65rem] text-muted">total</div>
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-2.5">
          {data.map((slice) => (
            <li key={slice.label} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate text-body">{slice.label}</span>
              <span className="font-semibold text-foreground">{valueFormatter(slice.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
