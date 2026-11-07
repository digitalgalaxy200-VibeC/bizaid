/**
 * WΛIDE° AI Provider Abstraction
 *
 * Implements the provider-agnostic AI interface described in the architecture doc.
 * P1 (primary) → P2 (fallback) → P3 (fallback) → graceful human escalation.
 *
 * Uses Vercel AI SDK's unified interface for streaming.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { LanguageModelV1 } from "ai";

export type ModelTier = "fast" | "standard" | "strong";

interface ProviderConfig {
  name: string;
  getFastModel: () => LanguageModelV1;
  getStandardModel: () => LanguageModelV1;
  getStrongModel: () => LanguageModelV1;
  isAvailable: () => boolean;
}

// --- Provider definitions ---

const openaiProvider: ProviderConfig = {
  name: "openai",
  getFastModel: () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY })("gpt-4o-mini"),
  getStandardModel: () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY })("gpt-4o-mini"),
  getStrongModel: () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY })("gpt-4o"),
  isAvailable: () => !!process.env.OPENAI_API_KEY,
};

const anthropicProvider: ProviderConfig = {
  name: "anthropic",
  getFastModel: () => createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-3-haiku-20240307"),
  getStandardModel: () => createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-3-5-haiku-20241022"),
  getStrongModel: () => createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-3-5-sonnet-20241022"),
  isAvailable: () => !!process.env.ANTHROPIC_API_KEY,
};

// Ordered priority: P1 → P2 (failover chain)
const PROVIDERS: ProviderConfig[] = [openaiProvider, anthropicProvider];

/**
 * Get the best available model for the given tier.
 * Falls back through providers automatically.
 */
export function getModel(tier: ModelTier): LanguageModelV1 {
  for (const provider of PROVIDERS) {
    if (!provider.isAvailable()) continue;
    switch (tier) {
      case "fast":     return provider.getFastModel();
      case "standard": return provider.getStandardModel();
      case "strong":   return provider.getStrongModel();
    }
  }
  throw new Error("No AI provider available. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY.");
}
