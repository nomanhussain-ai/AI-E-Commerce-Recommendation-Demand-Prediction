/**
 * `CORE_API_URL` (server-only) is used for calls made from Server
 * Components / Server Actions / NextAuth's `authorize()`. `NEXT_PUBLIC_*`
 * vars are inlined into the browser bundle at build time — Next.js strips
 * every non-public `process.env.*` reference from client code, so
 * `config/api/client.ts` picks whichever one is actually available at
 * runtime (see its `resolveBaseUrl()`).
 */
export const env = {
  CORE_API_URL: process.env.CORE_API_URL ?? "http://localhost:8000/api/v1",
  PUBLIC_CORE_API_URL: process.env.NEXT_PUBLIC_CORE_API_URL ?? "http://localhost:8000/api/v1",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
