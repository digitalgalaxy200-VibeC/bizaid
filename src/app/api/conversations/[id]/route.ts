/**
 * WΛIDE° Single Conversation Details & Messages API
 * GET /api/conversations/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getTenantDbBySlug } from "@/lib/db/tenant";
import { conversations, customers, messages } from "../../../../../drizzle/schema/tenant";
import { asc, eq } from "drizzle-orm";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const session = await auth();
    const tenantSlug = (session as any)?.tenantSlug;

    if (!session || !tenantSlug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const tenantDb = await getTenantDbBySlug(tenantSlug);

    // Get conversation details
    const conv = await tenantDb
      .select({
        id: conversations.id,
        customerId: conversations.customerId,
        source: conversations.source,
        sourceRef: conversations.sourceRef,
        status: conversations.status,
        isHumanActive: conversations.isHumanActive,
        startedAt: conversations.startedAt,
        lastMessageAt: conversations.lastMessageAt,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
      })
      .from(conversations)
      .leftJoin(customers, eq(customers.id, conversations.customerId))
      .where(eq(conversations.id, conversationId))
      .get();

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get all messages for this conversation
    const messageList = await tenantDb
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({
      conversation: conv,
      messages: messageList,
    });
  } catch (error: any) {
    console.error("[api/conversations/[id] GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch conversation" }, { status: 500 });
  }
}
