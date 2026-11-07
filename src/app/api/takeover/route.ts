/**
 * WΛIDE° Human Takeover API
 * POST /api/takeover
 * Handles:
 * - Action "toggle": Flip isHumanActive on/off
 * - Action "reply": Send an agent reply directly into the conversation
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getTenantDbBySlug } from "@/lib/db/tenant";
import { conversations, messages } from "../../../../drizzle/schema/tenant";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const TakeoverSchema = z.object({
  conversationId: z.string().min(1),
  action: z.enum(["toggle", "reply"]),
  isHumanActive: z.boolean().optional(),
  replyContent: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const tenantSlug = (session as any)?.tenantSlug;

    if (!session || !tenantSlug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = TakeoverSchema.parse(body);
    const tenantDb = await getTenantDbBySlug(tenantSlug);
    const now = new Date();

    if (data.action === "toggle") {
      const activeState = data.isHumanActive ?? true;

      await tenantDb
        .update(conversations)
        .set({
          isHumanActive: activeState,
          status: activeState ? "human" : "active",
        })
        .where(eq(conversations.id, data.conversationId));

      return NextResponse.json({
        success: true,
        isHumanActive: activeState,
        status: activeState ? "human" : "active",
      });
    }

    if (data.action === "reply") {
      if (!data.replyContent?.trim()) {
        return NextResponse.json({ error: "Reply content cannot be empty" }, { status: 400 });
      }

      const newMessage = {
        id: nanoid(),
        conversationId: data.conversationId,
        role: "human-agent",
        content: data.replyContent.trim(),
        model: null,
        tokensUsed: null,
        createdAt: now,
      };

      await tenantDb.batch([
        tenantDb.insert(messages).values(newMessage),
        tenantDb
          .update(conversations)
          .set({
            lastMessageAt: now,
            isHumanActive: true,
            status: "human",
          })
          .where(eq(conversations.id, data.conversationId)),
      ]);

      return NextResponse.json({ success: true, message: newMessage });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request data", details: error.issues }, { status: 400 });
    }
    console.error("[api/takeover POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process takeover action" }, { status: 500 });
  }
}
