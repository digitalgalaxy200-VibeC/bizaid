/**
 * WΛIDE° Retrieve-First Model Router
 *
 * Implements the routing logic from the architecture document:
 * - Direct knowledge lookup → fast model
 * - Multiple related lookups → standard model
 * - Reasoning across facts / calculations → strong model
 * - Unknown info → do NOT invent; escalate to human
 */

import { type ModelTier } from "./providers";
import type { RetrievedContext } from "../knowledge/retrieval";

export type RoutingDecision = {
  tier: ModelTier;
  reason: string;
  shouldEscalate: boolean;
};

/**
 * Determine which model tier to use based on:
 * - The retrieved knowledge context quality
 * - The complexity of the customer's message
 */
export function routeRequest(
  customerMessage: string,
  context: RetrievedContext
): RoutingDecision {
  const { knowledgeItems, products, hasDirectAnswer, confidence } = context;

  // No knowledge at all → escalate rather than hallucinate
  if (!hasDirectAnswer && knowledgeItems.length === 0 && products.length === 0) {
    return {
      tier: "fast",
      reason: "No relevant knowledge found — will indicate AI cannot answer",
      shouldEscalate: true,
    };
  }

  // High confidence single fact → fast model for natural language composition
  if (hasDirectAnswer && confidence > 0.85 && knowledgeItems.length === 1) {
    return {
      tier: "fast",
      reason: "High-confidence single knowledge item — fast composition",
      shouldEscalate: false,
    };
  }

  // Multiple items or medium confidence → standard model
  if (knowledgeItems.length > 1 || products.length > 0) {
    return {
      tier: "standard",
      reason: "Multiple knowledge sources — standard reasoning",
      shouldEscalate: false,
    };
  }

  // Complex message patterns suggesting reasoning needed
  const needsReasoning = /compar|calculat|different|better|recommend|which.*best/i.test(customerMessage);
  if (needsReasoning) {
    return {
      tier: "strong",
      reason: "Message requires comparison or recommendation reasoning",
      shouldEscalate: false,
    };
  }

  // Default: standard model
  return {
    tier: "standard",
    reason: "Default standard routing",
    shouldEscalate: false,
  };
}
