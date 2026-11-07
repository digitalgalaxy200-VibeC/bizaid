/**
 * POST /api/auth/change-password
 *
 * Change the signed-in user's password.
 * Requires the current password — a valid session alone is not enough,
 * so a stolen session cannot lock the owner out.
 *
 * Existing JWT sessions stay valid until they expire; the new password is
 * required at the next sign-in.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { controlDb } from "@/lib/db/control";
import { users } from "../../../../../drizzle/schema/control";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(100, "New password is too long"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!session || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = ChangePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from the current one." },
        { status: 400 }
      );
    }

    const user = await controlDb
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "This account has no password to change." },
        { status: 400 }
      );
    }

    // Dynamic import keeps bcryptjs out of the static module graph.
    const bcrypt = await import("bcryptjs");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await controlDb
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[change-password] Error:", error);
    return NextResponse.json(
      { error: "Could not update password. Please try again." },
      { status: 500 }
    );
  }
}
