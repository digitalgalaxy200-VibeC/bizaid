/**
 * WΛIDE° Chat API Route
 *
 * POST /api/chat
 *
 * Receives customer messages from the public chat UI,
 * retrieves relevant business knowledge, routes to the
 * appropriate AI model, streams the response back,
 * and automatically logs Knowledge Proposals when gap questions occur.
 */

import { streamText, type Message } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantDbBySlug } from "@/lib/db/tenant";
import { retrieveContext } from "@/lib/knowledge/retrieval";
import { routeRequest } from "@/lib/ai/router";
import { getModel } from "@/lib/ai/providers";
import { eq, asc } from "drizzle-orm";
import { conversations, messages, knowledgeProposals } from "../../../../drizzle/schema/tenant";
import { controlDb } from "@/lib/db/control";
import { agentRegistry } from "../../../../drizzle/schema/control";
import { nanoid } from "nanoid";

const RequestSchema = z.object({
  agentSlug: z.string().min(1),
  conversationId: z.string().optional(),
  message: z.string().min(1).max(2000),
  sessionToken: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentSlug, conversationId, message, sessionToken, source } =
      RequestSchema.parse(body);

    // 1. Resolve tenant DB
    const tenantDb = await getTenantDbBySlug(agentSlug);

    // 2. Load agent config
    const agent = await controlDb
      .select()
      .from(agentRegistry)
      .where(eq(agentRegistry.slug, agentSlug))
      .get();

    if (!agent || !agent.isActive) {
      return NextResponse.json({ error: "Agent not found or inactive" }, { status: 404 });
    }

    const now = new Date();

    // 3. Ensure a conversation record exists
    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = nanoid();
      await tenantDb.insert(conversations).values({
        id: activeConvId,
        customerId: null,
        source: source || "direct",
        sourceRef: source || null,
        status: "active",
        isHumanActive: false,
        sessionToken: sessionToken || null,
        metadata: null,
        startedAt: now,
        lastMessageAt: now,
        closedAt: null,
      });
    }

    // 4. Check if conversation is in human-takeover mode
    const activeConversation = await tenantDb
      .select()
      .from(conversations)
      .where(eq(conversations.id, activeConvId))
      .get();

    if (activeConversation?.isHumanActive) {
      return NextResponse.json(
        { error: "Human agent is currently handling this conversation" },
        { status: 409 }
      );
    }

    // Save user's incoming message
    await tenantDb.insert(messages).values({
      id: nanoid(),
      conversationId: activeConvId,
      role: "user",
      content: message,
      model: null,
      tokensUsed: null,
      createdAt: now,
    });

    // 5. Retrieve relevant business knowledge (retrieve-first)
    const context = await retrieveContext(tenantDb, message);

    // 6. Route to appropriate model tier
    const { tier, shouldEscalate } = routeRequest(message, context);

    // 7. If escalation needed (knowledge gap), log a Knowledge Proposal automatically!
    if (shouldEscalate) {
      // Controlled learning: log the gap question
      await tenantDb.insert(knowledgeProposals).values({
        id: nanoid(),
        conversationId: activeConvId,
        question: message,
        proposedAnswer: null,
        status: "pending",
        reviewedAt: null,
        createdAt: now,
      });

      const fallbackMessage =
        agent.persona?.includes("formal")
          ? "I want to make sure I give you accurate information. Please allow me to connect you with someone from the team who can assist you directly."
          : "I want to make sure I give you the right answer! Let me get someone from the team to help you now 🙏";

      // Save assistant fallback message
      await tenantDb.insert(messages).values({
        id: nanoid(),
        conversationId: activeConvId,
        role: "assistant",
        content: fallbackMessage,
        model: "rule-fallback",
        tokensUsed: null,
        createdAt: new Date(),
      });

      return NextResponse.json({ role: "assistant", content: fallbackMessage, escalated: true });
    }

    // 8. Load recent conversation history for context
    const recentMessages: Message[] = (
      await tenantDb
        .select({ role: messages.role, content: messages.content })
        .from(messages)
        .where(eq(messages.conversationId, activeConvId))
        .orderBy(asc(messages.createdAt))
        .limit(20)
    ).map((m) => ({ role: m.role as "user" | "assistant", content: m.content, id: "" }));

    // 9. Build the system prompt
    const systemPrompt = buildSystemPrompt(agent, context);

    // 10. Stream response from AI model
    const model = getModel(tier);
    const result = await streamText({
      model,
      system: systemPrompt,
      messages: recentMessages,
      maxTokens: 500,
      temperature: 0.3,
      async onFinish({ text }) {
        // Save assistant reply when stream finishes
        try {
          await tenantDb.insert(messages).values({
            id: nanoid(),
            conversationId: activeConvId!,
            role: "assistant",
            content: text,
            model: `${tier}-route`,
            tokensUsed: null,
            createdAt: new Date(),
          });
          await tenantDb
            .update(conversations)
            .set({ lastMessageAt: new Date() })
            .where(eq(conversations.id, activeConvId!));
        } catch (e) {
          console.error("Failed to save streamed message:", e);
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[chat/route] Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function buildSystemPrompt(
  agent: { name: string; persona: string | null },
  context: { knowledgeItems: Array<{question: string | null; answer: string; type: string}>; products: Array<{name: string; description: string | null; price: number | null; inStock: boolean}> }
): string {
  const knowledge = context.knowledgeItems
    .map((k) => k.question ? `Q: ${k.question}\nA: ${k.answer}` : k.answer)
    .join("\n\n");

  const productList = context.products
    .map((p) => `${p.name}${p.price ? ` — ₦${p.price}` : ""}${p.inStock ? " (In Stock)" : " (Out of Stock)"}${p.description ? `\n${p.description}` : ""}`)
    .join("\n");

  return `You are ${agent.name}, an AI assistant for this business.
${agent.persona ? `Your personality: ${agent.persona}` : "Be friendly, helpful, and concise."}

IMPORTANT RULES:
- Only answer based on the business information provided below.
- If you do not know the answer, say so honestly — do NOT make up information.
- Keep answers concise and mobile-friendly (2-4 sentences max unless more detail is needed).
- Never reveal that you are powered by any external AI service.

${knowledge ? `BUSINESS KNOWLEDGE:\n${knowledge}` : ""}
${productList ? `\nPRODUCTS & SERVICES:\n${productList}` : ""}`.trim();
}
