"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cartApi } from "@/config/api/cart.api";

export function AddToCartButton({
  productId,
  stock,
  compact = false,
}: {
  productId: string;
  stock: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function onAdd() {
    if (!session?.accessToken) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);
    try {
      await cartApi.addItem(productId, qty, session.accessToken);
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setLoading(false);
    }
  }

  if (stock <= 0) {
    return (
      <Button disabled className="w-full">
        Out of stock
      </Button>
    );
  }

  if (compact) {
    return (
      <Button onClick={onAdd} loading={loading} className="px-3 py-1.5 text-xs">
        {added ? <Check size={14} /> : <ShoppingCart size={14} />}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="grid h-10 w-10 place-items-center text-body hover:bg-surface-muted"
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-medium text-foreground">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(stock, q + 1))}
          className="grid h-10 w-10 place-items-center text-body hover:bg-surface-muted"
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>
      <Button onClick={onAdd} loading={loading} className="flex-1">
        {added ? (
          <>
            <Check size={16} /> Added
          </>
        ) : (
          <>
            <ShoppingCart size={16} /> Add to cart
          </>
        )}
      </Button>
    </div>
  );
}
