import { Package, Star } from "lucide-react";

import { Pagination } from "@/components/admin/Pagination";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductFilterBar } from "@/components/admin/ProductFilterBar";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { formatCurrency } from "@/utils/format";
import { auth } from "@/lib/auth";
import { categoryApi, productApi } from "@/config/api";

export const metadata = { title: "Products" };

type SearchParams = Record<string, string | undefined>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1) || 1;
  const session = await auth();

  const [categories, result] = await Promise.all([
    categoryApi.getAllCategories(session?.accessToken),
    productApi.getAllProducts(
      {
        q: sp.q,
        category_id: sp.category_id,
        is_active: sp.is_active === "true" ? true : sp.is_active === "false" ? false : undefined,
        sort: sp.sort ?? "-created",
        page,
        page_size: 20,
      },
      session?.accessToken,
    ),
  ]);

  const { data: products, meta } = result;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Products" subtitle={`${meta.pagination.total} products in the catalog`} />

      <Card className="p-0">
        <ProductFilterBar categories={categories} />

        {products.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">
            No products match these filters.
          </p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>
                <Th>Rating</Th>
                <Th>Status</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {products.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-muted">
                        <Package size={17} />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{p.title}</div>
                        <div className="truncate font-mono text-[0.7rem] text-muted">{p.sku}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{p.category_name ?? "â€”"}</Td>
                  <Td className="font-semibold text-foreground">{formatCurrency(p.price)}</Td>
                  <Td>
                    <span className={p.stock === 0 ? "font-semibold text-danger" : ""}>
                      {p.stock === 0 ? "Out of stock" : p.stock}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Star size={13} className="fill-warning text-warning" />
                      {p.rating_avg.toFixed(1)}
                      <span className="text-xs text-muted">({p.rating_count})</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={p.is_active ? "success" : "neutral"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td>
                    <ProductRowActions id={p.id} title={p.title} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {meta.pagination.total_pages > 1 && (
          <Pagination
            page={meta.pagination.page}
            totalPages={meta.pagination.total_pages}
            total={meta.pagination.total}
            pageSize={meta.pagination.page_size}
          />
        )}
      </Card>
    </div>
  );
}
