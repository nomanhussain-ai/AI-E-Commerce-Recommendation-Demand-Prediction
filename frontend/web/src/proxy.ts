import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

// Optimistic redirect only — presence of a valid NextAuth session, not a
// full profile check. The real check is `requireUser()`/`requireAdmin()` in
// the Server Component tree (src/lib/dal.ts), per Next.js's auth guidance.
const PROTECTED_PREFIXES = ["/admin", "/account", "/verify-email", "/cart", "/checkout"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/verify-email", "/cart/:path*", "/checkout/:path*"],
};
