import { coreFetch } from "./client";
import { toSearchParams } from "@/utils/search-params";
import type { CreateProductInput, Product, ProductQuery, UpdateProductInput } from "@/types/products";
import type { Paginated } from "@/types/common";

export const productApi = {
  getAllProducts: (query: ProductQuery = {}, token?: string) =>
    coreFetch<Paginated<Product>>(`/products${toSearchParams(query)}`, {}, token),

  getProductById: (idOrSlug: string, token?: string) =>
    coreFetch<Product>(`/products/${idOrSlug}`, {}, token),

  createProduct: (payload: CreateProductInput, token: string) =>
    coreFetch<Product>("/admin/products", { method: "POST", body: payload }, token),

  updateProduct: (id: string, payload: UpdateProductInput, token: string) =>
    coreFetch<Product>(`/admin/products/${id}`, { method: "PUT", body: payload }, token),

  deleteProduct: (id: string, token: string) =>
    coreFetch<void>(`/admin/products/${id}`, { method: "DELETE" }, token),
};
