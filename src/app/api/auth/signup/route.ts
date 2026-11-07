/**
 * POST /api/auth/signup
 * Register a new business owner account + create their tenant + agent.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { controlDb } from "@/lib/db/control";
import {
  destroyProvisionedTenant,
  provisionTenantDatabase,
  type ProvisionedTenant,
} from "@/lib/db/provision";
import { isTenantProvisioningConfigured } from "@/lib/turso/platform";
import { users, tenants, memberships, agentRegistry } from "../../../../../drizzle/schema/control";

const SignupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  businessName: z.string().min(2).max(100),
});

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export async function POST(req: NextRequest) {
  try {
    if (!isTenantProvisioningConfigured()) {
      console.error(
        "[signup] Tenant provisioning is not configured. Set TURSO_API_TOKEN and TURSO_ORG_NAME."
      );
      return NextResponse.json(
        { error: "Account creation is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const data = SignupSchema.parse(body);

    const existing = await controlDb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .get();

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(data.password, 12);

    const now = new Date();
    const userId = nanoid();
    const tenantId = nanoid();

    let slug = slugify(data.businessName);
    const existingSlug = await controlDb
      .select({ id: agentRegistry.id })
      .from(agentRegistry)
      .where(eq(agentRegistry.slug, slug))
      .get();
    if (existingSlug) slug = `${slug}-${nanoid(5)}`;

    // Create the tenant's isolated Turso database before writing control rows.
    let provisioned: ProvisionedTenant;
    try {
      provisioned = await provisionTenantDatabase({
        tenantId,
        businessName: data.businessName,
        ownerEmail: data.email.toLowerCase(),
      });
    } catch (provisionError) {
      console.error("[signup] Tenant provisioning failed:", provisionError);
      return NextResponse.json(
        { error: "Could not set up your workspace. Please try again." },
        { status: 500 }
      );
    }

    try {
      await controlDb.batch([
        controlDb.insert(users).values({
          id: userId,
          email: data.email.toLowerCase(),
          name: data.name,
          passwordHash,
          createdAt: now,
          updatedAt: now,
        }),
        controlDb.insert(tenants).values({
          id: tenantId,
          slug,
          name: data.businessName,
          dbUrl: provisioned.dbUrl,
          dbAuthToken: provisioned.dbAuthToken,
          createdAt: now,
          updatedAt: now,
        }),
        controlDb.insert(memberships).values({
          id: nanoid(),
          userId,
          tenantId,
          role: "owner",
          createdAt: now,
        }),
        controlDb.insert(agentRegistry).values({
          id: nanoid(),
          tenantId,
          slug,
          name: data.businessName + " Assistant",
          welcomeMessage: "Hi! I am the " + data.businessName + " assistant. How can I help you today?",
          createdAt: now,
          updatedAt: now,
        }),
      ]);
    } catch (dbError) {
      // Control rows failed to write — remove the orphaned tenant database.
      await destroyProvisionedTenant(provisioned.dbName).catch((cleanupError) => {
        console.error(
          `[signup] Failed to roll back database "${provisioned.dbName}":`,
          cleanupError
        );
      });
      throw dbError;
    }

    return NextResponse.json({ success: true, slug }, { status: 201 });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("[signup] Error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
