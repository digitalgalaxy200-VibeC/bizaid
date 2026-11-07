/**
 * WΛIDE° Knowledge Retrieval
 *
 * Implements the retrieve-first architecture:
 * 1. Direct keyword/text search across active knowledge items and products.
 * 2. Returns structured context for the AI router and prompt builder.
 *
 * NOTE: At MVP stage this uses simple keyword search.
 * Future: replace with vector embeddings for semantic search.
 */

import { like, eq, or } from "drizzle-orm";
import type { TenantDb } from "../db/tenant";
import { knowledgeItems, products } from "../../../drizzle/schema/tenant";

export type RetrievedContext = {
  knowledgeItems: Array<{ question: string | null; answer: string; type: string }>;
  products: Array<{ name: string; description: string | null; price: number | null; inStock: boolean }>;
  hasDirectAnswer: boolean;
  confidence: number; // 0.0 – 1.0
};

/**
 * Retrieve relevant knowledge for a customer message.
 * Keep this fast — it runs on every message.
 */
export async function retrieveContext(
  db: TenantDb,
  customerMessage: string
): Promise<RetrievedContext> {
  // Extract simple keywords (3+ chars, ignore common words)
  const stopWords = new Set(["the", "is", "are", "do", "you", "have", "can", "what", "how", "and", "for"]);
  const keywords = customerMessage
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w))
    .slice(0, 5); // limit to top 5 keywords

  if (keywords.length === 0) {
    return { knowledgeItems: [], products: [], hasDirectAnswer: false, confidence: 0 };
  }

  // Build search conditions
  const knowledgeConditions = keywords.flatMap((kw) => [
    like(knowledgeItems.question, `%${kw}%`),
    like(knowledgeItems.answer, `%${kw}%`),
  ]);

  const productConditions = keywords.flatMap((kw) => [
    like(products.name, `%${kw}%`),
    like(products.description, `%${kw}%`),
    like(products.category, `%${kw}%`),
  ]);

  const [foundKnowledge, foundProducts] = await Promise.all([
    db
      .select({
        question: knowledgeItems.question,
        answer: knowledgeItems.answer,
        type: knowledgeItems.type,
      })
      .from(knowledgeItems)
      .where(and(eq(knowledgeItems.isActive, true), or(...knowledgeConditions)))
      .limit(5),

    db
      .select({
        name: products.name,
        description: products.description,
        price: products.price,
        inStock: products.inStock,
      })
      .from(products)
      .where(and(eq(products.isActive, true), or(...productConditions)))
      .limit(10),
  ]);

  const hasDirectAnswer = foundKnowledge.length > 0 || foundProducts.length > 0;
  const confidence = hasDirectAnswer
    ? Math.min(1, (foundKnowledge.length * 0.3) + (foundProducts.length * 0.1))
    : 0;

  return {
    knowledgeItems: foundKnowledge,
    products: foundProducts,
    hasDirectAnswer,
    confidence,
  };
}

// Helper: drizzle 'and' polyfill import
function and(...conditions: unknown[]) {
  // drizzle-orm and() usage
  const { and: drizzleAnd } = require("drizzle-orm");
  return drizzleAnd(...conditions);
}
