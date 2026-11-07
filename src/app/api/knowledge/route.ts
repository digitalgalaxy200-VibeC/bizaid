/**
 * WΛIDE° Knowledge API
 * GET /api/knowledge - List knowledge items
 * POST /api/knowledge - Create new knowledge item
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getTenantDbBySlug } from "@/lib/db/tenant";
import { knowledgeItems } from "../../../../drizzle/schema/tenant";
import { nanoid } from "nanoid";
import { desc } from "drizzle-orm";
import { z } from "zod";

const CreateKnowledgeSchema = z.object({
  type: z.enum(["faq", "policy", "info", "product"]).default("faq"),
  question: z.string().optional(),
  answer: z.string().min(1, "Answer/Content is required"),
  category: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const tenantSlug = (session as any)?.tenantSlug;

    if (!session || !tenantSlug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantDb = await getTenantDbBySlug(tenantSlug);
    const items = await tenantDb
      .select()
      .from(knowledgeItems)
      .orderBy(desc(knowledgeItems.createdAt));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[api/knowledge GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch knowledge items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const tenantSlug = (session as any)?.tenantSlug;

    if (!session || !tenantSlug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = CreateKnowledgeSchema.parse(body);

    const tenantDb = await getTenantDbBySlug(tenantSlug);
    const now = new Date();

    const newItem = {
      id: nanoid(),
      type: data.type,
      question: data.question || null,
      answer: data.answer,
      category: data.category || null,
      tags: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await tenantDb.insert(knowledgeItems).values(newItem);

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    console.error("[api/knowledge POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create knowledge item" }, { status: 500 });
  }
}
