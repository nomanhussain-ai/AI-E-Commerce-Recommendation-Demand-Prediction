export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  is_active: boolean;
  product_count: number;
};

export type CreateCategoryInput = { name: string };
export type UpdateCategoryInput = { name: string };
