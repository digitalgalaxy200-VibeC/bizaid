/**
 * WΛIDE° Tenant Schema DDL
 *
 * Idempotent DDL for a fresh tenant database, kept in sync with
 * `drizzle/schema/tenant.ts`. Applied during signup, right after the
 * tenant's Turso database is created.
 *
 * These statements are idempotent so provisioning can be safely retried.
 * Regenerate the reference SQL with:
 *   npx drizzle-kit generate --dialect sqlite --schema ./drizzle/schema/tenant.ts --out /tmp/tenant
 */

import type { Client } from "@libsql/client";

export const TENANT_SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS \`business_profile\` (
    \`id\` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
    \`business_name\` text NOT NULL,
    \`tagline\` text,
    \`description\` text,
    \`phone\` text,
    \`email\` text,
    \`address\` text,
    \`city\` text,
    \`country\` text DEFAULT 'NG',
    \`currency\` text DEFAULT 'NGN',
    \`opening_hours\` text,
    \`social_links\` text,
    \`updated_at\` integer NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS \`customers\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`name\` text,
    \`phone\` text,
    \`email\` text,
    \`source\` text,
    \`notes\` text,
    \`created_at\` integer NOT NULL,
    \`updated_at\` integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS \`customers_phone_idx\` ON \`customers\` (\`phone\`)`,
  `CREATE INDEX IF NOT EXISTS \`customers_email_idx\` ON \`customers\` (\`email\`)`,

  `CREATE TABLE IF NOT EXISTS \`conversations\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`customer_id\` text,
    \`source\` text,
    \`source_ref\` text,
    \`status\` text DEFAULT 'active' NOT NULL,
    \`is_human_active\` integer DEFAULT false NOT NULL,
    \`session_token\` text,
    \`metadata\` text,
    \`started_at\` integer NOT NULL,
    \`last_message_at\` integer,
    \`closed_at\` integer,
    FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE INDEX IF NOT EXISTS \`conversations_status_idx\` ON \`conversations\` (\`status\`)`,
  `CREATE INDEX IF NOT EXISTS \`conversations_customer_idx\` ON \`conversations\` (\`customer_id\`)`,
  `CREATE INDEX IF NOT EXISTS \`conversations_source_idx\` ON \`conversations\` (\`source\`)`,

  `CREATE TABLE IF NOT EXISTS \`messages\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`conversation_id\` text NOT NULL,
    \`role\` text NOT NULL,
    \`content\` text NOT NULL,
    \`model\` text,
    \`tokens_used\` integer,
    \`created_at\` integer NOT NULL,
    FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversations\`(\`id\`) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE INDEX IF NOT EXISTS \`messages_conversation_idx\` ON \`messages\` (\`conversation_id\`)`,
  `CREATE INDEX IF NOT EXISTS \`messages_created_at_idx\` ON \`messages\` (\`created_at\`)`,

  `CREATE TABLE IF NOT EXISTS \`knowledge_proposals\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`conversation_id\` text,
    \`question\` text NOT NULL,
    \`proposed_answer\` text,
    \`status\` text DEFAULT 'pending' NOT NULL,
    \`reviewed_at\` integer,
    \`created_at\` integer NOT NULL,
    FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversations\`(\`id\`) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE INDEX IF NOT EXISTS \`knowledge_proposals_status_idx\` ON \`knowledge_proposals\` (\`status\`)`,

  `CREATE TABLE IF NOT EXISTS \`knowledge_items\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`type\` text NOT NULL,
    \`question\` text,
    \`answer\` text NOT NULL,
    \`category\` text,
    \`tags\` text,
    \`is_active\` integer DEFAULT true NOT NULL,
    \`created_at\` integer NOT NULL,
    \`updated_at\` integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS \`knowledge_items_type_idx\` ON \`knowledge_items\` (\`type\`)`,
  `CREATE INDEX IF NOT EXISTS \`knowledge_items_active_idx\` ON \`knowledge_items\` (\`is_active\`)`,

  `CREATE TABLE IF NOT EXISTS \`products\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`name\` text NOT NULL,
    \`description\` text,
    \`category\` text,
    \`price\` real,
    \`currency\` text DEFAULT 'NGN',
    \`unit\` text,
    \`in_stock\` integer DEFAULT true NOT NULL,
    \`image_url\` text,
    \`variants\` text,
    \`is_active\` integer DEFAULT true NOT NULL,
    \`created_at\` integer NOT NULL,
    \`updated_at\` integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS \`products_category_idx\` ON \`products\` (\`category\`)`,
  `CREATE INDEX IF NOT EXISTS \`products_active_idx\` ON \`products\` (\`is_active\`)`,
];

/** Apply the tenant schema to an already-connected tenant database. */
export async function applyTenantSchema(client: Client): Promise<void> {
  await client.batch([...TENANT_SCHEMA_STATEMENTS], "write");
}
