import { FolderTree } from "lucide-react";

import { CategoryFormBar } from "@/components/admin/CategoryFormBar";
import { CategoryRowActions } from "@/components/admin/CategoryRowActions";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { formatCompactNumber } from "@/utils/format";
import { auth } from "@/lib/auth";
import { categoryApi } from "@/config/api";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const session = await auth();
  const categories = await categoryApi.getAllCategories(session?.accessToken);
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Categories" subtitle={`${categories.length} categories`} />

      <Card className="p-0">
        <CategoryFormBar />

        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No categories yet.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Parent</Th>
                <Th>Slug</Th>
                <Th>Products</Th>
                <Th>Status</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {categories.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-hover">
                        <FolderTree size={15} />
                      </span>
                      <span className="font-medium text-foreground">{c.name}</span>
                    </div>
                  </Td>
                  <Td>{c.parent_id ? (nameById.get(c.parent_id) ?? "â€”") : <span className="text-muted">â€”</span>}</Td>
                  <Td className="font-mono text-xs">{c.slug}</Td>
                  <Td className="font-semibold text-foreground">
                    {formatCompactNumber(c.product_count)}
                  </Td>
                  <Td>
                    <Badge tone={c.is_active ? "success" : "neutral"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td>
                    <CategoryRowActions id={c.id} name={c.name} productCount={c.product_count} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
