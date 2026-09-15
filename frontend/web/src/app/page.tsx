import { redirect } from "next/navigation";

import { ProductGrid } from "@/components/shop/ProductGrid";
import { StorefrontHeader } from "@/components/shop/StorefrontHeader";
import { getCurrentUser } from "@/lib/dal";
import { productApi } from "@/config/api";

type SearchParams = Record<string, string | undefined>;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (user?.role === "admin") {
    redirect("/admin");
  }

  const sp = await searchParams;
  const { data: products } = await productApi.getAllProducts({
    q: sp.q,
    category_id: sp.category_id,
    is_active: true,
    page_size: 24,
  });

  return (
    <div className="min-h-full">
      <StorefrontHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {!sp.q && !sp.category_id && (
          <div className="mb-6 overflow-hidden rounded-card bg-gradient-to-br from-primary to-primary-hover p-6 text-primary-fg sm:p-10">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              AI-powered picks, made for you
            </span>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
              Shop smarter with ShopIQ
            </h1>
            <p className="mt-1.5 max-w-md text-sm text-white/85">
              Personalized recommendations and honest stock levels — no guesswork.
            </p>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {sp.q ? `Results for "${sp.q}"` : "All products"}
          </h2>
          <span className="text-sm text-muted">{products.length} products</span>
        </div>

        <ProductGrid products={products} />
      </main>
    </div>
  );
}
