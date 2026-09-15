import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/format";

const STATUS_TONE: Record<string, BadgeTone> = {
  paid: "success",
  pending: "warning",
  shipped: "info",
  cancelled: "danger",
};

export function RecentOrdersTable({
  orders,
}: {
  orders: {
    id: string;
    customer: string;
    amount: number;
    status: string;
    time: string;
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <a href="/admin/orders" className="text-xs font-semibold text-primary-hover">
          View all
        </a>
      </CardHeader>

      <div className="overflow-x-auto p-2">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="rounded-lg hover:bg-surface-muted">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={o.customer} size={30} />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{o.customer}</div>
                      <div className="text-[0.7rem] text-muted">{o.time}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-body">{o.id}</td>
                <td className="px-3 py-2.5 font-semibold text-foreground">
                  {formatCurrency(o.amount)}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={STATUS_TONE[o.status] ?? "neutral"} className="capitalize">
                    {o.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
