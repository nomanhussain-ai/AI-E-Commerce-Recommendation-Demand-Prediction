import type { BadgeTone } from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/orders";

export const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: "warning",
  paid: "success",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
  refunded: "neutral",
};
