/**
 * WΛIDE° Settings API
 * GET /api/settings - Fetch agent and business profile settings
 * POST /api/settings - Update agent configuration and business profile
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { controlDb } from "@/lib/db/control";
import { getTenantDbBySlug } from "@/lib/db/tenant";
import { agentRegistry, tenants } from "../../../../drizzle/schema/control";
import { businessProfile } from "../../../../drizzle/schema/tenant";
import { eq } from "drizzle-orm";
import { z } from "zod";

const SettingsUpdateSchema = z.object({
  // Agent configuration (Control DB)
  agentName: z.string().min(1).max(100),
  persona: z.string().max(1000).optional().nullable(),
  welcomeMessage: z.string().max(500).optional().nullable(),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color").default("#3a5cff"),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),

  // Business profile (Tenant DB)
  businessName: z.string().min(1).max(100).optional(),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  openingHours: z.string().max(500).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const tenantId = (session as any)?.tenantId;
    const tenantSlug = (session as any)?.tenantSlug;

    if (!session || !tenantId || !tenantSlug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch agent configuration from Control DB
    const agent = await controlDb
      .select()
      .from(agentRegistry)
      .where(eq(agentRegistry.tenantId, tenantId))
      .get();

    // 2. Fetch business profile from Tenant DB
    const tenantDb = await getTenantDbBySlug(tenantSlug);
    let profile = await tenantDb
      .select()
      .from(businessProfile)
      .where(eq(businessProfile.id, "singleton"))
      .get();

    // If profile row doesn't exist yet, initialize it
    if (!profile) {
      const now = new Date();
      const initialProfile = {
        id: "singleton",
        businessName: (session as any)?.tenantName || "My Business",
        tagline: null,
        description: null,
        phone: null,
        email: session.user?.email || null,
        address: null,
        city: null,
        country: "NG",
        currency: "NGN",
        openingHours: "Mon-Sat: 9:00 AM - 6:00 PM",
        socialLinks: null,
        updatedAt: now,
      };
      await tenantDb.insert(businessProfile).values(initialProfile);
      profile = initialProfile;
    }

    return NextResponse.json({
      agent: {
        name: agent?.name || "AI Assistant",
        slug: agent?.slug || tenantSlug,
        persona: agent?.persona || "Friendly, warm, professional skincare and sales assistant.",
        welcomeMessage: agent?.welcomeMessage || "Hi! How can I help you today? 👋",
        primaryColor: agent?.primaryColor || "#3a5cff",
        logoUrl: agent?.logoUrl || "",
        chatLink: `/a/${agent?.slug || tenantSlug}`,
      },
      profile: {
        businessName: profile?.businessName || (session as any)?.tenantName || "",
        tagline: profile?.tagline || "",
        description: profile?.description || "",
        phone: profile?.phone || "",
        email: profile?.email || "",
        address: profile?.address || "",
        city: profile?.city || "",
        openingHours: profile?.openingHours || "",
      },
    });
  } catch (error: any) {
    console.error("[api/settings GET] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const tenantId = (session as any)?.tenantId;
    const tenantSlug = (session as any)?.tenantSlug;

    if (!session || !tenantId || !tenantSlug) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = SettingsUpdateSchema.parse(body);
    const now = new Date();

    // 1. Update Agent Registry in Control DB
    await controlDb
      .update(agentRegistry)
      .set({
        name: data.agentName,
        persona: data.persona || null,
        welcomeMessage: data.welcomeMessage || null,
        primaryColor: data.primaryColor,
        logoUrl: data.logoUrl || null,
        updatedAt: now,
      })
      .where(eq(agentRegistry.tenantId, tenantId));

    // 2. Update Business Profile in Tenant DB
    const tenantDb = await getTenantDbBySlug(tenantSlug);
    await tenantDb
      .insert(businessProfile)
      .values({
        id: "singleton",
        businessName: data.businessName || "My Business",
        tagline: data.tagline || null,
        description: data.description || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        country: "NG",
        currency: "NGN",
        openingHours: data.openingHours || null,
        socialLinks: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: businessProfile.id,
        set: {
          businessName: data.businessName || "My Business",
          tagline: data.tagline || null,
          description: data.description || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          city: data.city || null,
          openingHours: data.openingHours || null,
          updatedAt: now,
        },
      });

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid form input", details: error.issues }, { status: 400 });
    }
    console.error("[api/settings POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
