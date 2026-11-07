/**
 * WΛIDE° Knowledge Proposals API
 * GET /api/proposals - Fetch pending/reviewed proposals
 * POST /api/proposals - Approve or reject a proposal
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getTenantDbBySlug } from "@/lib/db/tenant";
import { knowledgeProposals, knowledgeItems } from "../../../../drizzle/schema/tenant";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const ActionSchema = z.object({
  proposalId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  officialAnswer: z.string().min(1).optional(),
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
    const proposals = await tenantDb
      .select()
      .from(knowledgeProposals)
      .orderBy(desc(knowledgeProposals.createdAt))
      .limit(50);

    return NextResponse.json({ proposals });
  } catch (error: any) {
    console.error("[api/proposals GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch proposals" }, { status: 500 });
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
    const data = ActionSchema.parse(body);
    const tenantDb = await getTenantDbBySlug(tenantSlug);
    const now = new Date();

    const proposal = await tenantDb
      .select()
      .from(knowledgeProposals)
      .where(eq(knowledgeProposals.id, data.proposalId))
      .get();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    if (data.action === "reject") {
      await tenantDb
        .update(knowledgeProposals)
        .set({ status: "rejected", reviewedAt: now })
        .where(eq(knowledgeProposals.id, data.proposalId));

      return NextResponse.json({ success: true, message: "Proposal rejected" });
    }

    if (data.action === "approve") {
      const finalAnswer = data.officialAnswer?.trim() || proposal.proposedAnswer?.trim();
      if (!finalAnswer) {
        return NextResponse.json({ error: "An approved answer is required" }, { status: 400 });
      }

      // Add to official knowledge base & mark proposal approved in one batch
      await tenantDb.batch([
        tenantDb.insert(knowledgeItems).values({
          id: nanoid(),
          type: "faq",
          question: proposal.question,
          answer: finalAnswer,
          category: data.category || "General",
          tags: "learned-from-customer",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }),
        tenantDb
          .update(knowledgeProposals)
          .set({
            status: "approved",
            proposedAnswer: finalAnswer,
            reviewedAt: now,
          })
          .where(eq(knowledgeProposals.id, data.proposalId)),
      ]);

      return NextResponse.json({ success: true, message: "Approved and added to AI knowledge base" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request data", details: error.issues }, { status: 400 });
    }
    console.error("[api/proposals POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process proposal action" }, { status: 500 });
  }
}
