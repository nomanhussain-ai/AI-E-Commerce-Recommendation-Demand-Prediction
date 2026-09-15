import { ConversionFunnel } from "@/components/admin/ConversionFunnel";
import { DonutBreakdown } from "@/components/admin/DonutBreakdown";
import { PageHeader } from "@/components/admin/PageHeader";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { formatCompactNumber, formatCurrency } from "@/utils/format";
import { categoryBreakdown, funnel, salesSeries, segments } from "@/lib/mock/admin-dashboard";
import { topProductsByRevenue } from "@/lib/mock/top-products";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Analytics" subtitle="Sales, funnel and customer segment breakdown Â· M3" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={salesSeries} />
        </div>
        <DonutBreakdown
          title="Sales by category"
          subtitle="This week"
          data={categoryBreakdown.map((c) => ({ label: c.category, value: c.value, color: c.color }))}
          format="currency"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConversionFunnel data={funnel} />
        <DonutBreakdown
          title="Customer segments"
          subtitle="user_profiles.segment"
          data={segments.map((s) => ({ label: s.segment, value: s.value, color: s.color }))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top products by revenue</CardTitle>
        </CardHeader>
        <Table>
          <Thead>
            <Tr>
              <Th>Product</Th>
              <Th>Units sold</Th>
              <Th>Revenue</Th>
            </Tr>
          </Thead>
          <Tbody>
            {topProductsByRevenue.map((p) => (
              <Tr key={p.sku}>
                <Td>
                  <div className="font-medium text-foreground">{p.title}</div>
                  <div className="font-mono text-[0.7rem] text-muted">{p.sku}</div>
                </Td>
                <Td>{formatCompactNumber(p.units)}</Td>
                <Td className="font-semibold text-foreground">{formatCurrency(p.revenue)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
