import { Percent, Receipt, ShoppingBag, Sparkles, Users, Wallet } from "lucide-react";

import { ActivityTimeline } from "@/components/admin/ActivityTimeline";
import { ConversionFunnel } from "@/components/admin/ConversionFunnel";
import { DonutBreakdown } from "@/components/admin/DonutBreakdown";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { SearchQueriesTable } from "@/components/admin/SearchQueriesTable";
import { StatCard } from "@/components/admin/StatCard";
import { StockRiskCard } from "@/components/admin/StockRiskCard";
import { WelcomeCard } from "@/components/admin/WelcomeCard";
import { formatCompactNumber, formatCurrency, formatPercent } from "@/utils/format";
import {
  activity,
  categoryBreakdown,
  funnel,
  overview,
  recentOrders,
  salesSeries,
  segments,
  stockAlerts,
  topQueries,
} from "@/lib/mock/admin-dashboard";

export const metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted">
          Overview of sales, catalog health and AI module performance.
        </p>
      </div>

      <WelcomeCard salesGrowthPct={overview.revenue.delta_pct} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Revenue"
          value={formatCurrency(overview.revenue.value)}
          deltaPct={overview.revenue.delta_pct}
          icon={Wallet}
          tone="primary"
        />
        <StatCard
          label="Orders"
          value={formatCompactNumber(overview.orders.value)}
          deltaPct={overview.orders.delta_pct}
          icon={ShoppingBag}
          tone="info"
        />
        <StatCard
          label="Avg. order value"
          value={formatCurrency(overview.aov.value)}
          deltaPct={overview.aov.delta_pct}
          icon={Receipt}
          tone="warning"
        />
        <StatCard
          label="Conversion rate"
          value={formatPercent(overview.conversion_rate.value)}
          deltaPct={overview.conversion_rate.delta_pct}
          icon={Percent}
          tone="success"
        />
        <StatCard
          label="Active users"
          value={formatCompactNumber(overview.active_users.value)}
          deltaPct={overview.active_users.delta_pct}
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Recommendation CTR"
          value={formatPercent(overview.reco_ctr.value)}
          deltaPct={overview.reco_ctr.delta_pct}
          icon={Sparkles}
          tone="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={salesSeries} />
        </div>
        <DonutBreakdown
          title="Sales by category"
          subtitle="This week"
          data={categoryBreakdown.map((c) => ({
            label: c.category,
            value: c.value,
            color: c.color,
          }))}
          format="currency"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ConversionFunnel data={funnel} />
        <StockRiskCard alerts={stockAlerts} />
        <DonutBreakdown
          title="Customer segments"
          subtitle="M3 Â· user_profiles.segment"
          data={segments.map((s) => ({ label: s.segment, value: s.value, color: s.color }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentOrdersTable orders={recentOrders} />
        <ActivityTimeline items={activity} />
      </div>

      <SearchQueriesTable queries={topQueries} />
    </div>
  );
}
