import { Sparkles } from "lucide-react";

import { Card } from "@/components/ui/Card";

export function WelcomeCard({ salesGrowthPct }: { salesGrowthPct: number }) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-hover p-6 text-primary-fg sm:p-8">
      <div className="relative z-10 max-w-md">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          <Sparkles size={13} /> AI-powered insights
        </div>
        <h2 className="mt-3 text-xl font-bold sm:text-2xl">Welcome back, Admin 👋</h2>
        <p className="mt-1.5 text-sm text-white/85">
          Sales are up <span className="font-semibold text-white">{salesGrowthPct}%</span> this
          week and the hybrid recommender is driving{" "}
          <span className="font-semibold text-white">14.8%</span> of click-throughs. Here&apos;s
          today&apos;s snapshot.
        </p>
        <a
          href="/admin/analytics"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-hover transition-opacity hover:opacity-90"
        >
          View full analytics
        </a>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-white/10"
      />
    </Card>
  );
}
