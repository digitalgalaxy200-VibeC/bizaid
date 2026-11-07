/**
 * GET /api/health
 *
 * Safe deployment diagnostics. Reports only:
 * - whether required env vars are present (booleans, never values)
 * - the auth URL values (public URLs, not secrets)
 * - the request host the server actually received
 * - whether the control DB answers
 *
 * Useful for diagnosing "login redirects to localhost" on Vercel, where the
 * cause is always a NEXTAUTH_URL/AUTH_URL value baked into the environment.
 */
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { getControlDb } from "@/lib/db/control";
import { users } from "../../../../drizzle/schema/control";

export const dynamic = "force-dynamic";

const REQUIRED = [
  "TURSO_CONTROL_DB_URL",
  "TURSO_CONTROL_DB_AUTH_TOKEN",
  "NEXTAUTH_SECRET",
];

const OPTIONAL = [
  "TURSO_ORG_NAME",
  "TURSO_API_TOKEN",
  "TURSO_DB_GROUP",
  "DEEPSEEK_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
];

export async function GET() {
  const h = await headers();

  const present: Record<string, boolean> = {};
  for (const key of [...REQUIRED, ...OPTIONAL]) {
    present[key] = Boolean(process.env[key]);
  }

  // These are URLs, not secrets — safe to expose and the whole point here.
  const urls = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    AUTH_URL: process.env.AUTH_URL ?? null,
    NEXTAUTH_URL_INTERNAL: process.env.NEXTAUTH_URL_INTERNAL ?? null,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
    VERCEL_URL: process.env.VERCEL_URL ?? null,
    // If NEXTAUTH_URL/AUTH_URL is set, next-auth rewrites request origins to it.
    effectiveAuthOrigin:
      process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "request origin (good)",
  };

  let database = "unknown";
  try {
    await getControlDb().select({ n: sql<number>`1` }).from(users);
    database = "ok";
  } catch (error: any) {
    database = `error: ${String(error?.message ?? error).slice(0, 160)}`;
  }

  return NextResponse.json({
    ok: REQUIRED.every((k) => present[k]) && database === "ok",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
    requestHost: h.get("host"),
    requestProto: h.get("x-forwarded-proto"),
    requiredEnv: Object.fromEntries(REQUIRED.map((k) => [k, present[k]])),
    optionalEnv: Object.fromEntries(OPTIONAL.map((k) => [k, present[k]])),
    urls,
    database,
  });
}
