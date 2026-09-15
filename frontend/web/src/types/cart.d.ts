export type CartItem = {
  product_id: string;
  title: string;
  slug: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  stock: number;
  is_active: boolean;
};

export type Cart = {
  id: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  currency: string;
};
