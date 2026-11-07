/**
 * WΛIDE° Tenant Provisioning
 *
 * Creates the isolated Turso database for a new business, mints its
 * auth token, applies the tenant schema, and seeds the business profile.
 *
 * Everything here is best-effort reversible: if any step fails, the
 * freshly created database is deleted so signup can be retried cleanly.
 */

import { createClient } from "@libsql/client";
import {
  createDatabase,
  createDatabaseToken,
  deleteDatabase,
} from "../turso/platform";
import { applyTenantSchema } from "./tenant-schema";

export type ProvisionTenantInput = {
  tenantId: string;
  businessName: string;
  ownerEmail: string;
};

export type ProvisionedTenant = {
  /** Turso database name, kept for rollback. */
  dbName: string;
  dbUrl: string;
  dbAuthToken: string;
};

/** Turso DB names allow only lowercase letters, numbers and dashes (max 64). */
function databaseNameFor(tenantId: string): string {
  const clean = tenantId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return `waide-${clean}`;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * 2 ** attempt)
        );
      }
    }
  }

  throw lastError;
}

/**
 * Provision a ready-to-use tenant database.
 * Throws if Turso provisioning is not configured or fails.
 */
export async function provisionTenantDatabase(
  input: ProvisionTenantInput
): Promise<ProvisionedTenant> {
  const dbName = databaseNameFor(input.tenantId);
  const database = await createDatabase(dbName);
  const dbUrl = `libsql://${database.hostname}`;

  try {
    const dbAuthToken = await createDatabaseToken(database.name);

    // Newly created Turso databases can briefly refuse connections,
    // so retry the (idempotent) schema application.
    await withRetry(async () => {
      const client = createClient({ url: dbUrl, authToken: dbAuthToken });
      try {
        await applyTenantSchema(client);
        await client.execute({
          sql: `INSERT INTO business_profile
                  (id, business_name, email, country, currency, updated_at)
                VALUES ('singleton', ?, ?, 'NG', 'NGN', ?)
                ON CONFLICT(id) DO NOTHING`,
          args: [
            input.businessName,
            input.ownerEmail,
            Math.floor(Date.now() / 1000),
          ],
        });
      } finally {
        client.close();
      }
    });

    return { dbName: database.name, dbUrl, dbAuthToken };
  } catch (error) {
    // Roll back so a failed signup leaves no orphan database behind.
    await destroyProvisionedTenant(database.name).catch((cleanupError) => {
      console.error(
        `[provision] Failed to roll back database "${database.name}":`,
        cleanupError
      );
    });
    throw error;
  }
}

/** Delete a provisioned tenant database (rollback helper). */
export async function destroyProvisionedTenant(dbName: string): Promise<void> {
  await deleteDatabase(dbName);
}
