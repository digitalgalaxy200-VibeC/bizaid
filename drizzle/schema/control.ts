/**
 * WΛIDE° Control Database Schema
 *
 * The control DB is a single shared database that holds:
 * - Business accounts (tenants)
 * - User memberships
 * - Agent (AI assistant) registry
 * - Tenant database registry (where each tenant's DB lives)
 * - Platform admins (cross-tenant WΛIDE° staff)
 * - Subscription / plan info
 */

import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";

// ------------------------------------------------------------
// Tenants — one per business
// ------------------------------------------------------------
export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),             // nanoid
  slug: text("slug").notNull().unique(),   // e.g. "krish-beauty" → waide.ai/a/krish-beauty
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"), // free | starter | pro
  status: text("status").notNull().default("active"),
  dbUrl: text("db_url").notNull(),         // Turso DB URL for this tenant
  dbAuthToken: text("db_auth_token").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  slugIdx: index("tenants_slug_idx").on(t.slug),
}));

// ------------------------------------------------------------
// Users — business owner accounts
// ------------------------------------------------------------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),     // null if using OAuth
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ------------------------------------------------------------
// Memberships — links users to tenants (supports multi-business)
// ------------------------------------------------------------
export const memberships = sqliteTable("memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  role: text("role").notNull().default("owner"), // owner | admin | agent
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  userTenantIdx: index("memberships_user_tenant_idx").on(t.userId, t.tenantId),
}));

// ------------------------------------------------------------
// Agent Registry — the AI assistant config per tenant
// ------------------------------------------------------------
export const agentRegistry = sqliteTable("agent_registry", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id).unique(),
  slug: text("slug").notNull().unique(), // matches tenant slug for now
  name: text("name").notNull(),          // e.g. "Krish Beauty Assistant"
  persona: text("persona"),              // tone/personality description
  welcomeMessage: text("welcome_message"),
  primaryColor: text("primary_color").default("#3a5cff"),
  logoUrl: text("logo_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  tenantIdx: index("agent_registry_tenant_idx").on(t.tenantId),
  slugIdx: index("agent_registry_slug_idx").on(t.slug),
}));

// ------------------------------------------------------------
// Platform Admins — WΛIDE° staff with cross-tenant access
// ------------------------------------------------------------
// Membership is explicit (not a boolean on users) so grants can be
// audited and revoked independently of the account itself.
export const platformAdmins = sqliteTable("platform_admins", {
  userId: text("user_id").primaryKey().references(() => users.id),
  grantedAt: integer("granted_at", { mode: "timestamp" }).notNull(),
  grantedBy: text("granted_by"),           // who granted access (email or "bootstrap")
});
