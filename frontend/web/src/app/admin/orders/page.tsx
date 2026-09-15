import { OrdersTable } from "@/components/admin/OrdersTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { getAccessToken } from "@/lib/auth";
import { orderApi } from "@/config/api";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  // Non-null: this route sits under app/admin/layout.tsx's requireAdmin() guard.
  const token = (await getAccessToken())!;
  const initial = await orderApi.getAllOrdersAdmin({ page: 1, page_size: 10 }, token);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Orders" subtitle={`${initial.meta.pagination.total} orders`} />

      <Card className="p-0">
        <OrdersTable initial={initial} />
      </Card>
    </div>
  );
}
