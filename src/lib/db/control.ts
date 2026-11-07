/**
 * WΛIDE° Control Database Client
 *
 * Singleton connection to the shared control database.
 * Used to look up tenant info, users, agents, and memberships.
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../../../drizzle/schema/control";

if (!process.env.TURSO_CONTROL_DB_URL) {
  throw new Error("TURSO_CONTROL_DB_URL is not set");
}
if (!process.env.TURSO_CONTROL_DB_AUTH_TOKEN) {
  throw new Error("TURSO_CONTROL_DB_AUTH_TOKEN is not set");
}

const client = createClient({
  url: process.env.TURSO_CONTROL_DB_URL,
  authToken: process.env.TURSO_CONTROL_DB_AUTH_TOKEN,
});

export const controlDb = drizzle(client, { schema });

export type ControlDb = typeof controlDb;
