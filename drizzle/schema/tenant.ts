/**
 * WΛIDE° Tenant Database Schema
 *
 * Each business gets its own SQLite database (via Turso).
 * This schema is applied to every tenant database.
 *
 * Contains:
 * - Business profile & configuration
 * - Knowledge base (FAQs, products, policies)
 * - Conversations & messages
 * - Customer profiles
 * - Knowledge improvement proposals
 */

import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";

// ------------------------------------------------------------
// Business Profile — settings & identity for this business
// ------------------------------------------------------------
export const businessProfile = sqliteTable("business_profile", {
  id: text("id").primaryKey().default("singleton"),
  businessName: text("business_name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  country: text("country").default("NG"),
  currency: text("currency").default("NGN"),
  openingHours: text("opening_hours"),   // JSON string
  socialLinks: text("social_links"),     // JSON string
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ------------------------------------------------------------
// Knowledge Items — FAQs, policies, general business info
// ------------------------------------------------------------
export const knowledgeItems = sqliteTable("knowledge_items", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),           // faq | policy | info | product
  question: text("question"),             // for FAQ type
  answer: text("answer").notNull(),
  category: text("category"),
  tags: text("tags"),                     // comma-separated
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  typeIdx: index("knowledge_items_type_idx").on(t.type),
  activeIdx: index("knowledge_items_active_idx").on(t.isActive),
}));

// ------------------------------------------------------------
// Products — catalog with pricing
// ------------------------------------------------------------
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  price: real("price"),
  currency: text("currency").default("NGN"),
  unit: text("unit"),                     // per item, per kg, per litre
  inStock: integer("in_stock", { mode: "boolean" }).notNull().default(true),
  imageUrl: text("image_url"),
  variants: text("variants"),             // JSON: [{name, price, inStock}]
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  categoryIdx: index("products_category_idx").on(t.category),
  activeIdx: index("products_active_idx").on(t.isActive),
}));

// ------------------------------------------------------------
// Customers — built progressively from conversations
// ------------------------------------------------------------
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name"),
  phone: text("phone"),
  email: text("email"),
  source: text("source"),                 // whatsapp | instagram | direct
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  phoneIdx: index("customers_phone_idx").on(t.phone),
  emailIdx: index("customers_email_idx").on(t.email),
}));

// ------------------------------------------------------------
// Conversations — a single chat session
// ------------------------------------------------------------
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id), // null until identified
  source: text("source"),                 // whatsapp | instagram | facebook | direct
  sourceRef: text("source_ref"),          // ?src= param value
  status: text("status").notNull().default("active"), // active | human | closed
  isHumanActive: integer("is_human_active", { mode: "boolean" }).notNull().default(false),
  sessionToken: text("session_token"),    // for guest browser session
  metadata: text("metadata"),            // JSON
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
  closedAt: integer("closed_at", { mode: "timestamp" }),
}, (t) => ({
  statusIdx: index("conversations_status_idx").on(t.status),
  customerIdx: index("conversations_customer_idx").on(t.customerId),
  sourceIdx: index("conversations_source_idx").on(t.source),
}));

// ------------------------------------------------------------
// Messages — individual messages within a conversation
// ------------------------------------------------------------
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull(),           // user | assistant | human-agent | system
  content: text("content").notNull(),
  model: text("model"),                   // which AI model generated this (if assistant)
  tokensUsed: integer("tokens_used"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  conversationIdx: index("messages_conversation_idx").on(t.conversationId),
  createdAtIdx: index("messages_created_at_idx").on(t.createdAt),
}));

// ------------------------------------------------------------
// Knowledge Proposals — AI-detected gaps for owner review
// ------------------------------------------------------------
export const knowledgeProposals = sqliteTable("knowledge_proposals", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").references(() => conversations.id),
  question: text("question").notNull(),   // the customer question that triggered this
  proposedAnswer: text("proposed_answer"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  statusIdx: index("knowledge_proposals_status_idx").on(t.status),
}));
