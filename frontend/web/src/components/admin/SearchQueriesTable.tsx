import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCompactNumber } from "@/utils/format";

export function SearchQueriesTable({
  queries,
}: {
  queries: { query: string; searches: number; zeroResult: boolean; ctr: number }[];
}) {
  const max = Math.max(...queries.map((q) => q.searches));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Top search queries</CardTitle>
          <p className="mt-0.5 text-xs text-muted">Last 7 days Â· search_events</p>
        </div>
      </CardHeader>

      <div className="overflow-x-auto p-2">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Query</th>
              <th className="px-3 py-2 font-medium">Searches</th>
              <th className="px-3 py-2 font-medium">CTR</th>
            </tr>
          </thead>
          <tbody>
            {queries.map((q, i) => (
              <tr key={q.query} className="hover:bg-surface-muted">
                <td className="px-3 py-2.5 text-muted">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{q.query}</span>
                    {q.zeroResult && <Badge tone="danger">0 results</Badge>}
                  </div>
                </td>
                <td className="w-40 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(q.searches / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">{formatCompactNumber(q.searches)}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 font-semibold text-foreground">
                  {q.zeroResult ? "â€”" : `${q.ctr}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
