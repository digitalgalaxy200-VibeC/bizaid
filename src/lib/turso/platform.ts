/**
 * WΛIDE° Turso Platform API Client
 *
 * Thin wrapper over the Turso REST v1 API, used to provision one
 * isolated database per tenant (and to mint its auth token).
 *
 * Docs: https://docs.turso.tech/api-reference/databases/create
 *
 * Required env vars:
 * - TURSO_API_TOKEN : organization/user API token (not a database token)
 * - TURSO_ORG_NAME  : organization slug that owns the tenant databases
 * - TURSO_DB_GROUP  : optional, defaults to "default"
 */

const API_BASE = "https://api.turso.tech/v1";

export class TursoApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TursoApiError";
    this.status = status;
  }
}

type PlatformConfig = {
  token: string;
  org: string;
  group: string;
};

export function isTenantProvisioningConfigured(): boolean {
  return !isPlaceholder(process.env.TURSO_API_TOKEN) && !isPlaceholder(process.env.TURSO_ORG_NAME);
}

/** Treat empty and template values ("your-org", "changeme", ...) as unset. */
function isPlaceholder(value: string | undefined): boolean {
  if (!value || value.trim().length === 0) return true;
  return /^(your[-_]|placeholder|changeme|xxxx)/i.test(value.trim());
}

function getConfig(): PlatformConfig {
  const token = process.env.TURSO_API_TOKEN;
  const org = process.env.TURSO_ORG_NAME;

  if (isPlaceholder(token)) {
    throw new TursoApiError(500, "TURSO_API_TOKEN is not set");
  }
  if (isPlaceholder(org)) {
    throw new TursoApiError(500, "TURSO_ORG_NAME is not set");
  }

  return { token: token as string, org: org as string, group: process.env.TURSO_DB_GROUP || "default" };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { token } = getConfig();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  // DELETE returns 200 with a small body; 204 has no body.
  const text = await res.text();
  const body = text ? (JSON.parse(text) as Record<string, any>) : null;

  if (!res.ok) {
    const message =
      (body && typeof body.error === "string" && body.error) ||
      `Turso API request failed with status ${res.status}`;
    throw new TursoApiError(res.status, message);
  }

  return body as T;
}

function databasesPath(org: string): string {
  return `/organizations/${encodeURIComponent(org)}/databases`;
}

/**
 * Turso returns capitalized keys (Name/Hostname/DbId); accept lowercase too
 * so a future API casing change does not silently break provisioning.
 */
function pick<T>(obj: Record<string, any>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") return value as T;
  }
  return undefined;
}

export type TursoDatabase = {
  name: string;
  hostname: string;
  dbId: string;
};

/**
 * Create an empty database owned by the configured organization.
 * `name` must be lowercase letters, numbers and dashes (max 64 chars).
 */
export async function createDatabase(name: string): Promise<TursoDatabase> {
  const { org, group } = getConfig();

  const body = await request<Record<string, any>>(databasesPath(org), {
    method: "POST",
    body: JSON.stringify({ name, group }),
  });

  const database = (body?.database ?? {}) as Record<string, any>;
  const hostname = pick<string>(database, "Hostname", "hostname");

  if (!hostname) {
    throw new TursoApiError(502, `Turso did not return a hostname for "${name}"`);
  }

  return {
    name: pick<string>(database, "Name", "name") ?? name,
    hostname,
    dbId: pick<string>(database, "DbId", "dbId", "id") ?? "",
  };
}

/**
 * Mint a never-expiring, full-access token scoped to a single database.
 * This token is what the app uses at runtime to read/write that tenant.
 */
export async function createDatabaseToken(name: string): Promise<string> {
  const { org } = getConfig();
  const path = `${databasesPath(org)}/${encodeURIComponent(name)}/auth/tokens?expiration=never&authorization=full-access`;

  const body = await request<Record<string, any>>(path, { method: "POST" });
  const jwt = pick<string>(body ?? {}, "jwt", "token");

  if (!jwt) {
    throw new TursoApiError(502, `Turso did not return a token for "${name}"`);
  }

  return jwt;
}

/** Delete a database (used to roll back a partially-completed signup). */
export async function deleteDatabase(name: string): Promise<void> {
  const { org } = getConfig();
  await request(`${databasesPath(org)}/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}
