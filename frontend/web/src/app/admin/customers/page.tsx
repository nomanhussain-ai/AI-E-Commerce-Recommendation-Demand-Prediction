import { CustomerSearchBar } from "@/components/admin/CustomerSearchBar";
import { Pagination } from "@/components/admin/Pagination";
import { PageHeader } from "@/components/admin/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { formatCurrency } from "@/utils/format";
import { getAccessToken } from "@/lib/auth";
import { customerApi } from "@/config/api";
import type { CustomerSegment } from "@/types/customers";

export const metadata = { title: "Customers" };

const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  new: "New",
  window_shopper: "Window shopper",
  high_intent: "High intent",
  loyal: "Loyal",
};

const SEGMENT_TONE: Record<CustomerSegment, BadgeTone> = {
  new: "warning",
  window_shopper: "info",
  high_intent: "primary",
  loyal: "success",
};

type SearchParams = Record<string, string | undefined>;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1) || 1;
  // Non-null: this route sits under app/admin/layout.tsx's requireAdmin() guard.
  const token = (await getAccessToken())!;
  const { data: customers, meta } = await customerApi.getAllCustomers({ q: sp.q, page, page_size: 20 }, token);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Customers" subtitle={`${meta.pagination.total} customers`} />

      <Card className="p-0">
        <CustomerSearchBar />

        {customers.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No customers match this search.</p>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Customer</Th>
                <Th>Segment</Th>
                <Th>Orders</Th>
                <Th>Total spent</Th>
                <Th>Joined</Th>
              </Tr>
            </Thead>
            <Tbody>
              {customers.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.full_name} size={32} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{c.full_name}</div>
                        <div className="truncate text-[0.7rem] text-muted">{c.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={SEGMENT_TONE[c.segment]}>{SEGMENT_LABEL[c.segment]}</Badge>
                  </Td>
                  <Td>{c.orders_count}</Td>
                  <Td className="font-semibold text-foreground">
                    {formatCurrency(c.total_spent)}
                  </Td>
                  <Td className="text-xs text-muted">
                    {new Date(c.joined_at).toLocaleDateString()}
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
