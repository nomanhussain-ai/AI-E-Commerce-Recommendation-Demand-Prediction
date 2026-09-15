import { coreFetch, ApiError } from "./client";
import type { Cart } from "@/types/cart";

const EMPTY_CART: Cart = { id: "", items: [], item_count: 0, subtotal: 0, currency: "PKR" };

export const cartApi = {
  /** Empty cart for an anonymous visitor (no token) or an expired session. */
  getCart: async (token?: string): Promise<Cart> => {
    if (!token) return EMPTY_CART;
    try {
      return await coreFetch<Cart>("/cart", {}, token);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return EMPTY_CART;
      throw err;
    }
  },

  clearCart: (token: string) => coreFetch<void>("/cart", { method: "DELETE" }, token),

  addItem: (productId: string, quantity: number, token: string) =>
    coreFetch<Cart>("/cart/items", { method: "POST", body: { product_id: productId, quantity } }, token),

  updateItem: (productId: string, quantity: number, token: string) =>
    coreFetch<Cart>(`/cart/items/${productId}`, { method: "PATCH", body: { quantity } }, token),

  removeItem: (productId: string, token: string) =>
    coreFetch<Cart>(`/cart/items/${productId}`, { method: "DELETE" }, token),
};
