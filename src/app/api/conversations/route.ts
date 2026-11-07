/**
 * WΛIDE° Conversations API
 * GET /api/conversations
 * Returns all conversations for the authenticated business owner's tenant.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getTenantDbBySlug } from "@/lib/db/tenant";
import { conversations, customers, messages } from "../../../../drizzle/schema/tenant";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const tenantSlug = (session as any)?.tenantSlug;

    if (!session || !tenantSlug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantDb = await getTenantDbBySlug(tenantSlug);

    // Fetch conversations with customer information
    const convList = await tenantDb
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
      .orderBy(desc(conversations.lastMessageAt))
      .limit(50);

    return NextResponse.json({ conversations: convList });
  } catch (error: any) {
    console.error("[api/conversations GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch conversations" }, { status: 500 });
  }
}
