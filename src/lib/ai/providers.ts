/**
 * WΛIDE° AI Provider Abstraction
 *
 * Implements the provider-agnostic AI interface described in the architecture doc.
 * P1 (primary) → P2 (fallback) → P3 (fallback) → graceful human escalation.
 *
 * Uses Vercel AI SDK's unified interface for streaming.
 *
 * Provider order: OpenAI → DeepSeek → Anthropic.
 * DeepSeek is OpenAI-compatible, so it reuses the OpenAI provider with a
 * custom base URL.
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

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

/**
 * A provider only counts as available when its key looks real.
 * Placeholder values in .env (e.g. "sk-..." or "your-token-here") must not
 * shadow a working provider later in the failover chain.
 */
function hasUsableKey(
  value: string | undefined,
  { minLength = 20, prefix }: { minLength?: number; prefix?: string } = {}
): boolean {
  if (!value) return false;

  const key = value.trim();
  if (key.length < minLength) return false;
  if (prefix && !key.startsWith(prefix)) return false;
  if (/your-|placeholder|changeme|xxxx|\.\.\./i.test(key)) return false;

  return true;
}

// --- Provider definitions ---

const openaiProvider: ProviderConfig = {
  name: "openai",
  getFastModel: () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY })("gpt-4o-mini"),
  getStandardModel: () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY })("gpt-4o-mini"),
  getStrongModel: () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY })("gpt-4o"),
  isAvailable: () => hasUsableKey(process.env.OPENAI_API_KEY, { prefix: "sk-" }),
};

/**
 * DeepSeek exposes an OpenAI-compatible chat completions API.
 * - deepseek-chat     : general model (fast + standard tiers)
 * - deepseek-reasoner : reasoning model (strong tier)
 */
const deepseekProvider: ProviderConfig = {
  name: "deepseek",
  getFastModel: () =>
    createOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: DEEPSEEK_BASE_URL,
      compatibility: "compatible",
    })("deepseek-chat"),
  getStandardModel: () =>
    createOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: DEEPSEEK_BASE_URL,
      compatibility: "compatible",
    })("deepseek-chat"),
  getStrongModel: () =>
    createOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: DEEPSEEK_BASE_URL,
      compatibility: "compatible",
    })("deepseek-reasoner"),
  isAvailable: () => hasUsableKey(process.env.DEEPSEEK_API_KEY, { prefix: "sk-" }),
};

const anthropicProvider: ProviderConfig = {
  name: "anthropic",
  getFastModel: () => createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-3-haiku-20240307"),
  getStandardModel: () => createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-3-5-haiku-20241022"),
  getStrongModel: () => createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })("claude-3-5-sonnet-20241022"),
  isAvailable: () => hasUsableKey(process.env.ANTHROPIC_API_KEY, { prefix: "sk-ant-" }),
};

// Ordered priority: P1 → P2 → P3 (failover chain)
const PROVIDERS: ProviderConfig[] = [
  openaiProvider,
  deepseekProvider,
  anthropicProvider,
];

/** Names of providers with a usable key, in priority order (diagnostics). */
export function availableProviders(): string[] {
  return PROVIDERS.filter((p) => p.isAvailable()).map((p) => p.name);
}

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
  throw new Error(
    "No AI provider available. Configure one of OPENAI_API_KEY, DEEPSEEK_API_KEY, or ANTHROPIC_API_KEY."
  );
}
