/**
 * WΛIDE° Control Database Client
 *
 * Singleton connection to the shared control database.
 * Used to look up tenant info, users, agents, and memberships.
 *
 * The client is created lazily on first use. This keeps `next build`
 * (which imports route modules while "Collecting page data") from
 * requiring database credentials to be present at build time.
 */

import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../../../drizzle/schema/control";

export type ControlDb = LibSQLDatabase<typeof schema>;

let cached: ControlDb | null = null;

function createControlDb(): ControlDb {
  const url = process.env.TURSO_CONTROL_DB_URL;
  const authToken = process.env.TURSO_CONTROL_DB_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_CONTROL_DB_URL is not set");
  }
  if (!authToken) {
    throw new Error("TURSO_CONTROL_DB_AUTH_TOKEN is not set");
  }

  return drizzle(createClient({ url, authToken }), { schema });
}

/** Returns the shared control DB instance, creating it on first call. */
export function getControlDb(): ControlDb {
  if (!cached) {
    cached = createControlDb();
  }
  return cached;
}

/**
 * Proxy so existing `controlDb.select(...)` call sites work unchanged
 * without initializing the connection during module import.
 */
export const controlDb: ControlDb = new Proxy({} as ControlDb, {
  get(_target, prop) {
    const db = getControlDb();
    const value = Reflect.get(db, prop);
    return typeof value === "function" ? value.bind(db) : value;
  },
});
