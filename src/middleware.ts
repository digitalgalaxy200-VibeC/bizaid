/**
 * WΛIDE° Middleware
 * Protects /dashboard routes — redirects unauthenticated users to login.
 * Public routes (/a/*, /auth/*, /api/chat) are always accessible.
 */
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect dashboard
  if (pathname.startsWith("/dashboard") && !req.auth) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith("/auth/") && req.auth) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
