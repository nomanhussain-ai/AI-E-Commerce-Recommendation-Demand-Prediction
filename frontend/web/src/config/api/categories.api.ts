import { coreFetch } from "./client";
import type { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/categories";

export const categoryApi = {
  getAllCategories: (token?: string) => coreFetch<Category[]>("/categories", {}, token),

  createCategory: (payload: CreateCategoryInput, token: string) =>
    coreFetch<Category>("/admin/categories", { method: "POST", body: payload }, token),

  updateCategory: (id: string, payload: UpdateCategoryInput, token: string) =>
    coreFetch<Category>(`/admin/categories/${id}`, { method: "PUT", body: payload }, token),

  deleteCategory: (id: string, token: string) =>
    coreFetch<void>(`/admin/categories/${id}`, { method: "DELETE" }, token),
};
