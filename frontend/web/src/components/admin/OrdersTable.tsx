"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, Eye, Loader2, Search } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { orderApi } from "@/config/api/orders.api";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";
import { ORDER_STATUS_TONE } from "@/utils/constants/order-status";
import type { Order, OrderStatus } from "@/types/orders";
import type { Paginated } from "@/types/common";

import { OrderDetailDrawer } from "./OrderDetailDrawer";

const STATUS_OPTIONS: { label: string; value: OrderStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

export function OrdersTable({ initial }: { initial: Paginated<Order> }) {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [orders, setOrders] = useState(initial.data);
  const [pagination, setPagination] = useState(initial.meta.pagination);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  const fetchPage = useCallback(
    async (page: number, mode: "replace" | "append", filters: { q: string; status: OrderStatus | "" }) => {
      if (!session?.accessToken) return;
      setLoading(true);
      try {
        const data = await orderApi.getAllOrdersAdmin(
          { page, page_size: 10, q: filters.q || undefined, status: filters.status || undefined },
          session.accessToken,
        );
        setOrders((prev) => (mode === "append" ? [...prev, ...data.data] : data.data));
        setPagination(data.meta.pagination);
      } finally {
        setLoading(false);
      }
    },
    [session?.accessToken],
  );

  // Filter changes go straight to a fetch with the new values — not an effect
  // reacting to state, since fetchPage's own setState calls would then be
  // "synchronous within an effect" from the linter's point of view.
  function applyFilters(nextSearch: string, nextStatus: OrderStatus | "") {
    setSearch(nextSearch);
    setStatus(nextStatus);
    void fetchPage(1, "replace", { q: nextSearch, status: nextStatus });
  }

  const hasMore = pagination.page < pagination.total_pages;

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchPage(pagination.page + 1, "append", { q: search, status });
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, pagination.page, fetchPage, search, status]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-4">
        <label className="relative flex min-w-[220px] flex-1 items-center">
          <Search size={15} className="pointer-events-none absolute left-3 text-muted" />
          <Input
            placeholder="Search by order ID or customer…"
            className="pl-9"
            defaultValue={search}
            onChange={(e) => applyFilters(e.target.value, status)}
          />
        </label>
        <select
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          value={status}
          onChange={(e) => applyFilters(search, e.target.value as OrderStatus | "")}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {orders.length === 0 && !loading ? (
        <p className="p-8 text-center text-sm text-muted">No orders match these filters.</p>
      ) : (
        <>
          <Table>
            <Thead>
              <Tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Amount</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {orders.map((o) => (
                <Tr key={o.id}>
                  <Td className="font-mono text-xs text-foreground">
                    {o.id.replace("ord_", "").slice(0, 8).toUpperCase()}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={o.customer_name ?? "?"} size={28} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">
                          {o.customer_name}
                        </div>
                        <div className="truncate text-[0.7rem] text-muted">{o.customer_email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{o.items.reduce((n, i) => n + i.quantity, 0)}</Td>
                  <Td className="font-semibold text-foreground">
                    {formatCurrency(o.grand_total, o.currency)}
                  </Td>
                  <Td className="uppercase">{o.payment_method}</Td>
                  <Td>
                    <Badge tone={ORDER_STATUS_TONE[o.status]} className="capitalize">
                      {o.status}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-xs text-muted">
                    {new Date(o.placed_at).toLocaleString()}
                  </Td>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setSelected(o)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
                      aria-label={`View ${o.id}`}
                    >
                      <Eye size={16} />
                    </button>
                  </Td>
                </Tr>
              ))}

              {hasMore && (
                <tr ref={sentinelRef}>
                  <td colSpan={8} className="py-4 text-center text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" /> Loading more orders…
                    </span>
                  </td>
                </tr>
              )}
            </Tbody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm">
            <span className="text-muted">
              Showing <span className="font-medium text-foreground">{orders.length}</span> of{" "}
              <span className="font-medium text-foreground">{pagination.total}</span> · scroll for
              more
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fetchPage(pagination.page - 1, "replace", { q: search, status })}
                disabled={pagination.page <= 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-body hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => fetchPage(p, "replace", { q: search, status })}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg text-sm",
                    p === pagination.page
                      ? "bg-primary font-semibold text-primary-fg"
                      : "text-body hover:bg-surface-muted",
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => fetchPage(pagination.page + 1, "replace", { q: search, status })}
                disabled={pagination.page >= pagination.total_pages}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-body hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </>
      )}

      <OrderDetailDrawer order={selected} onClose={() => setSelected(null)} />
    </>
  );
}
