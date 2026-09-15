"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Minus, Package, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cartApi } from "@/config/api/cart.api";
import { formatCurrency } from "@/utils/format";
import type { Cart } from "@/types/cart";

export function CartItemsList({ initial }: { initial: Cart }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [cart, setCart] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateQty(productId: string, quantity: number) {
    if (!session?.accessToken) return;
    setBusyId(productId);
    try {
      const next =
        quantity === 0
          ? await cartApi.removeItem(productId, session.accessToken)
          : await cartApi.updateItem(productId, quantity, session.accessToken);
      setCart(next);
      router.refresh(); // keeps the navbar cart badge in sync
    } finally {
      setBusyId(null);
    }
  }

  if (cart.items.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <Package size={32} className="text-muted" />
        <p className="text-sm text-muted">Your cart is empty.</p>
        <Link href="/" className="text-sm font-semibold text-primary-hover">
          Continue shopping
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-3 lg:col-span-2">
        {cart.items.map((item) => (
          <Card key={item.product_id} className="flex items-center gap-4 p-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-surface-muted text-muted">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- external/unconfigured product image URLs
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Package size={22} />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <Link
                href={`/p/${item.slug}`}
                className="line-clamp-1 font-medium text-foreground hover:text-primary-hover"
              >
                {item.title}
              </Link>
              <div className="mt-0.5 text-sm text-muted">{formatCurrency(item.unit_price)}</div>
              {!item.is_active && (
                <div className="mt-1 text-xs font-medium text-danger">No longer available</div>
              )}
            </div>

            <div className="flex items-center rounded-lg border border-border">
              <button
                type="button"
                disabled={busyId === item.product_id}
                onClick={() => updateQty(item.product_id, item.quantity - 1)}
                className="grid h-9 w-9 place-items-center text-body hover:bg-surface-muted disabled:opacity-50"
                aria-label="Decrease quantity"
              >
                <Minus size={13} />
              </button>
              <span className="w-7 text-center text-sm font-medium text-foreground">
                {item.quantity}
              </span>
              <button
                type="button"
                disabled={busyId === item.product_id || item.quantity >= item.stock}
                onClick={() => updateQty(item.product_id, item.quantity + 1)}
                className="grid h-9 w-9 place-items-center text-body hover:bg-surface-muted disabled:opacity-50"
                aria-label="Increase quantity"
              >
                <Plus size={13} />
              </button>
            </div>

            <div className="w-24 shrink-0 text-right font-semibold text-foreground">
              {formatCurrency(item.line_total)}
            </div>

            <button
              type="button"
              disabled={busyId === item.product_id}
              onClick={() => updateQty(item.product_id, 0)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50"
              aria-label={`Remove ${item.title}`}
            >
              <Trash2 size={16} />
            </button>
          </Card>
        ))}
      </div>

      <Card className="h-fit p-5">
        <h2 className="text-base font-semibold text-foreground">Order summary</h2>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted">Subtotal ({cart.item_count} items)</span>
          <span className="font-medium text-foreground">{formatCurrency(cart.subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-muted">Shipping</span>
          <span className="font-medium text-foreground">Free</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(cart.subtotal)}
          </span>
        </div>
        <Link href="/checkout" className="mt-4 block">
          <Button className="w-full">Proceed to checkout</Button>
        </Link>
      </Card>
    </div>
  );
}
