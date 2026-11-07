/**
 * WΛIDE° Middleware
 * Protects /dashboard and /admin routes.
 * Public routes (/a/*, /auth/*, /api/chat) are always accessible.
 *
 * Platform-admin status comes from the JWT claim issued at sign-in, so no
 * database call is made here (middleware runs in the Edge runtime).
 */
import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Platform admin area — requires a session AND the admin claim
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    if (!(req.auth as any).isPlatformAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

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
  matcher: ["/dashboard/:path*", "/admin", "/admin/:path*", "/auth/:path*"],
};
