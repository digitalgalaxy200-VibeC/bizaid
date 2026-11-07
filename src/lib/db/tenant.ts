/**
 * WΛIDE° Tenant Database Resolver
 *
 * NEVER accept a tenant DB identifier from an untrusted client.
 * Always resolve tenant from a trusted agent slug or authenticated session.
 *
 * Each business gets its own isolated SQLite database in Turso.
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { controlDb } from "./control";
import { tenants, agentRegistry } from "../../../drizzle/schema/control";
import * as tenantSchema from "../../../drizzle/schema/tenant";

// In-memory cache: agentSlug → drizzle db instance
// In production, use a proper connection pool or LRU cache
const tenantDbCache = new Map<string, ReturnType<typeof drizzle>>();

/**
 * Resolve a tenant database by agent slug (from public URL).
 * This is safe — the slug maps to credentials stored server-side only.
 */
export async function getTenantDbBySlug(agentSlug: string) {
  if (tenantDbCache.has(agentSlug)) {
    return tenantDbCache.get(agentSlug)!;
  }

  // Look up tenant via agent registry (server-side only)
  const agent = await controlDb
    .select({
      tenantId: agentRegistry.tenantId,
      dbUrl: tenants.dbUrl,
      dbAuthToken: tenants.dbAuthToken,
      isActive: agentRegistry.isActive,
    })
    .from(agentRegistry)
    .innerJoin(tenants, eq(tenants.id, agentRegistry.tenantId))
    .where(eq(agentRegistry.slug, agentSlug))
    .get();

  if (!agent) {
    throw new Error(`No agent found for slug: ${agentSlug}`);
  }

  if (!agent.isActive) {
    throw new Error(`Agent is not active: ${agentSlug}`);
  }

  const client = createClient({
    url: agent.dbUrl,
    authToken: agent.dbAuthToken,
  });

  const db = drizzle(client, { schema: tenantSchema });
  tenantDbCache.set(agentSlug, db);

  return db;
}

export type TenantDb = Awaited<ReturnType<typeof getTenantDbBySlug>>;
