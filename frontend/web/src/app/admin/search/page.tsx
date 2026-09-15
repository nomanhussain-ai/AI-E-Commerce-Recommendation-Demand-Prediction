import { AlertCircle, Clock, MousePointerClick, RefreshCw, SearchIcon } from "lucide-react";

import { DonutBreakdown } from "@/components/admin/DonutBreakdown";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { formatCompactNumber, formatPercent } from "@/utils/format";
import { engineSplit, searchOverview, topQueries, zeroResultQueries } from "@/lib/mock/search";

export const metadata = { title: "Search" };

export default function SearchAnalyticsPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Search"
        subtitle="Meilisearch + Postgres FTS fallback â€” analytics & tuning"
        actions={
          <Button variant="outline">
            <RefreshCw size={15} /> Reindex
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total searches"
          value={formatCompactNumber(searchOverview.totalSearches.value)}
          deltaPct={searchOverview.totalSearches.deltaPct}
          icon={SearchIcon}
          tone="primary"
        />
        <StatCard
          label="Zero-result rate"
          value={formatPercent(searchOverview.zeroResultRate.value)}
          deltaPct={searchOverview.zeroResultRate.deltaPct}
          icon={AlertCircle}
          tone="danger"
        />
        <StatCard
          label="Avg. latency"
          value={`${searchOverview.avgLatencyMs.value} ms`}
          deltaPct={searchOverview.avgLatencyMs.deltaPct}
          icon={Clock}
          tone="info"
        />
        <StatCard
          label="Click-through rate"
          value={formatPercent(searchOverview.ctr.value)}
          deltaPct={searchOverview.ctr.deltaPct}
          icon={MousePointerClick}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top queries</CardTitle>
          </CardHeader>
          <Table>
            <Thead>
              <Tr>
                <Th>Query</Th>
                <Th>Searches</Th>
                <Th>CTR</Th>
              </Tr>
            </Thead>
            <Tbody>
              {topQueries.map((q) => (
                <Tr key={q.query}>
                  <Td className="font-medium text-foreground">{q.query}</Td>
                  <Td>{formatCompactNumber(q.searches)}</Td>
                  <Td>{q.ctr}%</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>

        <DonutBreakdown
          title="Engine split"
          subtitle="Which path served the query"
          data={engineSplit.map((e) => ({ label: e.label, value: e.pct, color: e.color }))}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Zero-result queries</CardTitle>
            <p className="mt-0.5 text-xs text-muted">
              Candidates for new synonyms or catalog gaps
            </p>
          </div>
        </CardHeader>
        <Table>
          <Thead>
            <Tr>
              <Th>Query</Th>
              <Th>Searches</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {zeroResultQueries.map((q) => (
              <Tr key={q.query}>
                <Td className="font-medium text-foreground">{q.query}</Td>
                <Td>{formatCompactNumber(q.searches)}</Td>
                <Td>
                  <Button variant="outline" className="px-3 py-1.5 text-xs">
                    Add synonym
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
