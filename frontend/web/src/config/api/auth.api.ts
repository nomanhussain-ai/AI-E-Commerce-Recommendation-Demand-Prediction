import { coreFetch } from "./client";
import type { AccessPair, LoginInput, RegisterInput, ResetPasswordInput, TokenPair, User } from "@/types/auth";

export const authApi = {
  login: (payload: LoginInput) => coreFetch<TokenPair>("/auth/login", { method: "POST", body: payload }),

  register: (payload: RegisterInput) =>
    coreFetch<TokenPair>("/auth/register", { method: "POST", body: payload }),

  refresh: (refreshToken: string) =>
    coreFetch<AccessPair>("/auth/refresh", { method: "POST", body: { refresh_token: refreshToken } }),

  logout: (refreshToken: string) =>
    coreFetch<void>("/auth/logout", { method: "POST", body: { refresh_token: refreshToken } }),

  forgotPassword: (email: string) =>
    coreFetch<{ message: string; debug_reset_otp?: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (payload: ResetPasswordInput) =>
    coreFetch<void>("/auth/reset-password", { method: "POST", body: payload }),

  // Authenticated — the user is already signed in but not yet email-verified.
  sendOtp: (token: string) =>
    coreFetch<{ message: string; debug_otp?: string }>("/auth/send-otp", { method: "POST" }, token),

  verifyEmail: (code: string, token: string) =>
    coreFetch<User>("/auth/verify-email", { method: "POST", body: { code } }, token),
};
