export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";

export type OrderItem = {
  id: string;
  product_id: string;
  title_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type Order = {
  id: string;
  user_id: string;
  customer_name: string | null;
  customer_email: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping_total: number;
  grand_total: number;
  currency: string;
  payment_method: string;
  shipping_address: string;
  placed_at: string;
  items: OrderItem[];
};

export type PlaceOrderInput = { shipping_address: string; payment_method: string };

export type OrderQuery = { page?: number; page_size?: number };

export type OrderAdminQuery = {
  q?: string;
  status?: string;
  page?: number;
  page_size?: number;
};
