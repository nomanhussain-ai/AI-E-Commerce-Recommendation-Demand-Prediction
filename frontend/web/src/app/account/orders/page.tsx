import Link from "next/link";
import { Package } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/format";
import { getAccessToken } from "@/lib/auth";
import { requireUser } from "@/lib/dal";
import { orderApi } from "@/config/api";
import { ORDER_STATUS_TONE } from "@/utils/constants/order-status";

export const metadata = { title: "My orders" };

export default async function MyOrdersPage() {
  await requireUser();
  // Non-null: requireUser() above redirects to /login when there's no session.
  const token = (await getAccessToken())!;
  const { data: orders } = await orderApi.getMyOrders({ page_size: 50 }, token);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">My orders</h1>
        <p className="mt-0.5 text-sm text-muted">{orders.length} orders</p>
      </div>

      {orders.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Package size={32} className="text-muted" />
          <p className="text-sm text-muted">You haven&apos;t placed any orders yet.</p>
          <Link href="/" className="text-sm font-semibold text-primary-hover">
            Start shopping
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-muted">
                    {o.id.replace("ord_", "#").slice(0, 9).toUpperCase()}
                  </div>
                  <div className="text-xs text-muted">
                    {new Date(o.placed_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge tone={ORDER_STATUS_TONE[o.status]} className="capitalize">
                  {o.status}
                </Badge>
              </div>

              <ul className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
                {o.items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-body">
                      {item.title_snapshot} Ã— {item.quantity}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(item.line_total, o.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted">Total</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(o.grand_total, o.currency)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
