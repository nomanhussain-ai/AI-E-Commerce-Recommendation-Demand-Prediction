import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { userApi } from "@/config/api/users.api";
import { ApiError } from "@/config/api/client";
import type { User } from "@/types/auth";

/**
 * Verifies the session against core-api (`GET /auth/me`) inside the Server
 * Component tree — this, not `proxy.ts`, is the real auth boundary. Always
 * fetched fresh (not read from the NextAuth JWT) so profile edits and
 * email-verification state are never stale. `cache()` de-dupes repeat calls
 * within one request/render pass.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await auth();
  if (!session?.accessToken) return null;

  try {
    return await userApi.getMe(session.accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
