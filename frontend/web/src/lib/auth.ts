import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authApi } from "@/config/api/auth.api";
import { ApiError } from "@/config/api/client";
import type { AppJwtFields } from "@/types/auth";

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // matches core-api's JWT access-token TTL

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        fullName: {},
        mode: {}, // "login" (default) or "register" — one provider, two backend calls
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        try {
          const tokens =
            credentials?.mode === "register"
              ? await authApi.register({
                  email,
                  password,
                  full_name: (credentials?.fullName as string) ?? "",
                })
              : await authApi.login({ email, password });

          return {
            id: tokens.user.id,
            email: tokens.user.email,
            name: tokens.user.full_name,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
          };
        } catch (err) {
          if (err instanceof ApiError) return null;
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as typeof token & AppJwtFields;

      if (user) {
        t.accessToken = user.accessToken;
        t.refreshToken = user.refreshToken;
        t.expiresAt = user.expiresAt;
        return t;
      }

      if (t.expiresAt && Date.now() < t.expiresAt - 60_000) return t;
      if (!t.refreshToken) return t;

      try {
        const refreshed = await authApi.refresh(t.refreshToken);
        t.accessToken = refreshed.access_token;
        t.refreshToken = refreshed.refresh_token;
        t.expiresAt = Date.now() + ACCESS_TOKEN_TTL_MS;
      } catch {
        // Dead refresh token — drop it so the app treats the visitor as signed out.
        t.accessToken = undefined;
        t.refreshToken = undefined;
      }
      return t;
    },
    async session({ session, token }) {
      session.accessToken = (token as AppJwtFields).accessToken;
      return session;
    },
  },
  events: {
    async signOut(message) {
      const refreshToken =
        "token" in message ? (message.token as AppJwtFields | undefined)?.refreshToken : undefined;
      if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    },
  },
});

/** Convenience for Server Components/Actions that just need the bearer token. */
export async function getAccessToken(): Promise<string | undefined> {
  const session = await auth();
  return session?.accessToken;
}
