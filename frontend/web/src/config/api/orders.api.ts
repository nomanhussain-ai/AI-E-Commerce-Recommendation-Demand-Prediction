import { coreFetch } from "./client";
import { toSearchParams } from "@/utils/search-params";
import type { Order, OrderAdminQuery, OrderQuery, OrderStatus, PlaceOrderInput } from "@/types/orders";
import type { Paginated } from "@/types/common";

export const orderApi = {
  placeOrder: (payload: PlaceOrderInput, token: string) =>
    coreFetch<Order>("/orders", { method: "POST", body: payload }, token),

  getMyOrders: (query: OrderQuery = {}, token: string) =>
    coreFetch<Paginated<Order>>(`/orders${toSearchParams(query)}`, {}, token),

  getMyOrder: (orderId: string, token: string) => coreFetch<Order>(`/orders/${orderId}`, {}, token),

  getAllOrdersAdmin: (query: OrderAdminQuery = {}, token: string) =>
    coreFetch<Paginated<Order>>(`/admin/orders${toSearchParams(query)}`, {}, token),

  updateOrderStatusAdmin: (id: string, status: OrderStatus, token: string) =>
    coreFetch<Order>(`/admin/orders/${id}`, { method: "PATCH", body: { status } }, token),
};
