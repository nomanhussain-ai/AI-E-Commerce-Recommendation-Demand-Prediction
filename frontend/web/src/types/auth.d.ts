import type { DefaultSession } from "next-auth";

export type UserRole = "customer" | "admin";

export type User = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  role: UserRole;
  is_email_verified: boolean;
};

export type TokenPair = {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type AccessPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type LoginInput = { email: string; password: string };
export type RegisterInput = { email: string; password: string; full_name: string };
export type ResetPasswordInput = { token: string; password: string };

/**
 * Augment NextAuth's session/user with only the FastAPI access token. Nothing
 * else (role, verification status) is cached here — callers that need those
 * always go through `requireUser()`/`getCurrentUser()` (src/lib/dal.ts),
 * which re-fetches the live profile from the backend, so there's no
 * staleness to reason about.
 *
 * The JWT side is NOT augmented here: `next-auth/jwt`'s `JWT` interface is
 * actually declared in `@auth/core/jwt` and, under pnpm's nested dependency
 * layout, that module doesn't reliably resolve to the same module instance
 * `next-auth` itself imports — so declaration merging silently fails. src/lib/auth.ts
 * casts to `AppJwtFields` (below) at the few spots that need it instead.
 */
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: DefaultSession["user"];
  }

  interface User {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }
}

export type AppJwtFields = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};
