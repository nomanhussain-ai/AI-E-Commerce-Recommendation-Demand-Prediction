import { RefreshCw, Sparkles } from "lucide-react";

import { CtrTrendChart } from "@/components/admin/CtrTrendChart";
import { DonutBreakdown } from "@/components/admin/DonutBreakdown";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { ctrTrend, modelRegistry, recoEval, recoReasonBreakdown } from "@/lib/mock/ml";

export const metadata = { title: "Recommendations" };

export default function RecommendationsPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Recommendations"
        subtitle="M1 · hybrid recommender — model registry & evaluation"
        actions={
          <Button>
            <RefreshCw size={15} /> Retrain
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CtrTrendChart data={ctrTrend} />
        </div>
        <DonutBreakdown
          title="Recommendation reasons"
          subtitle="Share of served items"
          data={recoReasonBreakdown.map((r) => ({ label: r.reason, value: r.pct, color: r.color }))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model registry</CardTitle>
        </CardHeader>
        <Table>
          <Thead>
            <Tr>
              <Th>Kind</Th>
              <Th>Version</Th>
              <Th>Strategy</Th>
              <Th>Trained</Th>
              <Th>Metric</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {modelRegistry.map((m) => (
              <Tr key={`${m.kind}-${m.version}`}>
                <Td>
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Sparkles size={14} className="text-primary" /> {m.kind}
                  </div>
                </Td>
                <Td className="font-mono text-xs">{m.version}</Td>
                <Td>{m.strategy}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">{m.trainedAt}</Td>
                <Td className="font-mono text-xs">{m.metric}</Td>
                <Td>
                  <Badge tone={m.isActive ? "success" : "neutral"}>
                    {m.isActive ? "Active" : "Retired"}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evaluation — temporal split</CardTitle>
        </CardHeader>
        <Table>
          <Thead>
            <Tr>
              <Th>Model</Th>
              <Th>P@10</Th>
              <Th>R@10</Th>
              <Th>NDCG@10</Th>
              <Th>Coverage</Th>
            </Tr>
          </Thead>
          <Tbody>
            {recoEval.map((row) => (
              <Tr key={row.model}>
                <Td className="font-medium text-foreground">{row.model}</Td>
                <Td>{row.p10.toFixed(3)}</Td>
                <Td>{row.r10.toFixed(3)}</Td>
                <Td>{row.ndcg10.toFixed(3)}</Td>
                <Td>{Math.round(row.coverage * 100)}%</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
