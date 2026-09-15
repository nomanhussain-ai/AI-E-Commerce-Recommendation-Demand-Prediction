import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { StorefrontHeader } from "@/components/shop/StorefrontHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/format";
import { getAccessToken } from "@/lib/auth";
import { requireUser } from "@/lib/dal";
import { orderApi } from "@/config/api";

export const metadata = { title: "Order confirmed" };

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireUser();
  const { orderId } = await params;
  // Non-null: requireUser() above redirects to /login when there's no session.
  const token = (await getAccessToken())!;
  const order = await orderApi.getMyOrder(orderId, token);

  return (
    <div className="min-h-full">
      <StorefrontHeader />
      <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={28} />
          </span>
          <h1 className="text-xl font-bold text-foreground">Order placed!</h1>
          <p className="text-sm text-muted">
            We&apos;ve emailed a confirmation for order{" "}
            <span className="font-mono text-foreground">
              {order.id.replace("ord_", "#").slice(0, 9).toUpperCase()}
            </span>
            .
          </p>

          <div className="mt-2 w-full rounded-lg bg-surface-muted p-4 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Items</span>
              <span className="font-medium text-foreground">
                {order.items.reduce((n, i) => n + i.quantity, 0)}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted">Total</span>
              <span className="font-bold text-foreground">
                {formatCurrency(order.grand_total, order.currency)}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted">Payment</span>
              <span className="font-medium uppercase text-foreground">
                {order.payment_method}
              </span>
            </div>
          </div>

          <div className="mt-4 flex w-full gap-2">
            <Link href="/account/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                View orders
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">Continue shopping</Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
