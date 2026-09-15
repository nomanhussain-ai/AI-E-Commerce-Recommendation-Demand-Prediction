export type CustomerSegment = "new" | "window_shopper" | "high_intent" | "loyal";

export type Customer = {
  id: string;
  full_name: string;
  email: string;
  joined_at: string;
  orders_count: number;
  total_spent: number;
  segment: CustomerSegment;
};

export type CustomerQuery = { q?: string; page?: number; page_size?: number };
