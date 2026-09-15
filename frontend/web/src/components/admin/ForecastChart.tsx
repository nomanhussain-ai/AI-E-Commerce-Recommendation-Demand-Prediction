"use client";

import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

type Point = { date: string; actual: number | null; yhat: number; lower: number; upper: number };

export function ForecastChart({ data }: { data: Point[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Demand forecast — next 30 days</CardTitle>
          <p className="mt-0.5 text-xs text-muted">ASUS TUF F15 Gaming Laptop · units/day</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-foreground" /> Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" /> Predicted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-soft" /> Confidence
          </span>
        </div>
      </CardHeader>

      <div className="h-72 px-2 pb-4 pt-4 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 0, right: 8, left: -8, bottom: 0 }}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} width={32} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                boxShadow: "var(--shadow-card)",
              }}
            />
            <Area dataKey="upper" stroke="none" fill="var(--primary)" fillOpacity={0.14} isAnimationActive={false} />
            <Area dataKey="lower" stroke="none" fill="var(--surface)" fillOpacity={1} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="yhat"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--primary)" }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="var(--foreground)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
