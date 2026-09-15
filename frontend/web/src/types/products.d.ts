export type Product = {
  id: string;
  sku: string;
  slug: string;
  title: string;
  description: string;
  category_id: string;
  category_name: string | null;
  brand: string | null;
  price: number;
  discount_price: number | null;
  currency: string;
  image_url: string | null;
  stock: number;
  rating_avg: number;
  rating_count: number;
  is_active: boolean;
};

export type ProductQuery = {
  q?: string;
  category_id?: string;
  brand?: string;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
  low_stock?: boolean;
  sort?: string;
  page?: number;
  page_size?: number;
};

export type CreateProductInput = {
  title: string;
  sku?: string;
  category_id: string;
  brand?: string;
  price: number;
  discount_price?: number;
  stock: number;
  description: string;
  image_url?: string;
  is_active: boolean;
};

export type UpdateProductInput = Partial<CreateProductInput>;
