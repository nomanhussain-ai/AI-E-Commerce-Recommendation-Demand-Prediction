import { coreFetch } from "./client";
import type { User } from "@/types/auth";

export type UpdateProfileInput = {
  full_name: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
};

export const userApi = {
  /** The live signed-in profile — backed by `GET /auth/me`. */
  getMe: (token: string) => coreFetch<User>("/auth/me", {}, token),

  updateMe: (payload: Partial<UpdateProfileInput>, token: string) =>
    coreFetch<User>("/users/me", { method: "PATCH", body: payload }, token),
};
