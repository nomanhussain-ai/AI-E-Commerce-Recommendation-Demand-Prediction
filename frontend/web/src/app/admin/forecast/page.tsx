import { DonutBreakdown } from "@/components/admin/DonutBreakdown";
import { ForecastChart } from "@/components/admin/ForecastChart";
import { PageHeader } from "@/components/admin/PageHeader";
import { Select } from "@/components/admin/Toolbar";
import { StockRiskCard } from "@/components/admin/StockRiskCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { stockAlerts } from "@/lib/mock/admin-dashboard";
import { forecastAccuracy, forecastSeries, riskDistribution } from "@/lib/mock/forecast";

export const metadata = { title: "Forecast" };

export default function ForecastPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Forecast"
        subtitle="M2 · LightGBM demand forecasting"
        actions={
          <Select
            options={[
              { label: "ASUS TUF F15 Gaming Laptop", value: "p1" },
              { label: "Samsung Galaxy A54", value: "p6" },
              { label: "Anker Soundcore Q30", value: "p2" },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ForecastChart data={forecastSeries} />
        </div>
        <DonutBreakdown
          title="Stock risk distribution"
          subtitle="Across active catalog"
          data={riskDistribution.map((r) => ({ label: r.risk, value: r.count, color: r.color }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Model accuracy — backtest</CardTitle>
          </CardHeader>
          <Table>
            <Thead>
              <Tr>
                <Th>Model</Th>
                <Th>MAE</Th>
                <Th>RMSE</Th>
                <Th>MAPE</Th>
                <Th>WAPE</Th>
              </Tr>
            </Thead>
            <Tbody>
              {forecastAccuracy.map((row) => (
                <Tr key={row.model}>
                  <Td className="font-medium text-foreground">{row.model}</Td>
                  <Td>{row.mae.toFixed(1)}</Td>
                  <Td>{row.rmse.toFixed(1)}</Td>
                  <Td>{row.mape.toFixed(1)}%</Td>
                  <Td>{row.wape.toFixed(1)}%</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>

        <StockRiskCard alerts={stockAlerts} />
      </div>
    </div>
  );
}
