import Link from "next/link";
import { Package, Star } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/format";
import type { Product } from "@/types/products";

import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  const hasDiscount = product.discount_price != null && product.discount_price < product.price;

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/p/${product.slug}`} className="block">
        <div className="grid aspect-square place-items-center bg-surface-muted text-muted">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- external/unconfigured product image URLs
            <img
              src={product.image_url}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={40} strokeWidth={1.2} />
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.brand && (
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            {product.brand}
          </span>
        )}
        <Link href={`/p/${product.slug}`} className="line-clamp-2 font-medium text-foreground">
          {product.title}
        </Link>

        <div className="flex items-center gap-1 text-xs text-muted">
          <Star size={12} className="fill-warning text-warning" />
          {product.rating_avg.toFixed(1)} ({product.rating_count})
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(hasDiscount ? product.discount_price! : product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

        {product.stock <= 5 && product.stock > 0 && (
          <Badge tone="warning" className="w-fit">
            Only {product.stock} left
          </Badge>
        )}

        <div className="mt-auto pt-2">
          <AddToCartButton productId={product.id} stock={product.stock} />
        </div>
      </div>
    </Card>
  );
}
