import { notFound } from "next/navigation";
import { Package, Star } from "lucide-react";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { StorefrontHeader } from "@/components/shop/StorefrontHeader";
import { Badge } from "@/components/ui/Badge";
import { ApiError } from "@/config/api/client";
import { productApi } from "@/config/api";
import { formatCurrency } from "@/utils/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await productApi.getProductById(slug);
    return { title: product.title };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let product;
  try {
    product = await productApi.getProductById(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const hasDiscount = product.discount_price != null && product.discount_price < product.price;

  return (
    <div className="min-h-full">
      <StorefrontHeader />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="grid aspect-square place-items-center rounded-card bg-surface-muted text-muted">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- external/unconfigured product image URLs
              <img
                src={product.image_url}
                alt={product.title}
                className="h-full w-full rounded-card object-cover"
              />
            ) : (
              <Package size={72} strokeWidth={1} />
            )}
          </div>

          <div className="flex flex-col gap-3">
            {product.brand && (
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {product.brand}
              </span>
            )}
            <h1 className="text-2xl font-bold text-foreground">{product.title}</h1>

            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Star size={14} className="fill-warning text-warning" />
              {product.rating_avg.toFixed(1)} ({product.rating_count} ratings)
              {product.category_name && (
                <>
                  <span>·</span>
                  <span>{product.category_name}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-foreground">
                {formatCurrency(hasDiscount ? product.discount_price! : product.price)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-muted line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            <div>
              {product.stock > 0 ? (
                <Badge tone={product.stock <= 5 ? "warning" : "success"}>
                  {product.stock <= 5 ? `Only ${product.stock} left` : "In stock"}
                </Badge>
              ) : (
                <Badge tone="danger">Out of stock</Badge>
              )}
            </div>

            {product.description && (
              <p className="whitespace-pre-line text-sm text-body">{product.description}</p>
            )}

            <div className="mt-2 max-w-xs">
              <AddToCartButton productId={product.id} stock={product.stock} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
