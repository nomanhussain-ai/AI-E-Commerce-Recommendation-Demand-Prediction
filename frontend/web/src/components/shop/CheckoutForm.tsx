"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Truck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { orderApi } from "@/config/api/orders.api";
import { ApiError } from "@/config/api/client";
import { formatCurrency } from "@/utils/format";
import type { Cart } from "@/types/cart";

export function CheckoutForm({ cart }: { cart: Cart }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.accessToken) return;
    setError(null);
    setLoading(true);

    try {
      const order = await orderApi.placeOrder(
        { shipping_address: address, payment_method: "cod" },
        session.accessToken,
      );
      router.push(`/checkout/${order.id}/confirmation`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Shipping address</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              required
              rows={4}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House / street, area, city, postal code"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 rounded-lg border border-primary bg-primary-soft p-3.5">
              <Truck size={18} className="text-primary-hover" />
              <div>
                <div className="text-sm font-medium text-foreground">Cash on Delivery</div>
                <p className="text-xs text-muted">Pay when your order arrives</p>
              </div>
            </label>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit p-5">
        <h2 className="text-base font-semibold text-foreground">Order summary</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {cart.items.map((item) => (
            <li key={item.product_id} className="flex justify-between text-sm">
              <span className="line-clamp-1 text-body">
                {item.title} × {item.quantity}
              </span>
              <span className="shrink-0 font-medium text-foreground">
                {formatCurrency(item.line_total)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(cart.subtotal)}
          </span>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <Button type="submit" loading={loading} className="mt-4 w-full">
          Place order
        </Button>
      </Card>
    </form>
  );
}
