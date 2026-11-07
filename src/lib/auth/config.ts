/**
 * WΛIDE° Auth Configuration (NextAuth v5)
 *
 * Uses credentials provider (email + password).
 * Passwords are hashed with bcrypt.
 * Session contains tenantId so server components can resolve the right DB.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { controlDb } from "@/lib/db/control";
import { users, memberships, tenants, agentRegistry } from "../../../drizzle/schema/control";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.tenantId = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
        token.tenantName = (user as any).tenantName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      (session as any).tenantId = token.tenantId;
      (session as any).tenantSlug = token.tenantSlug;
      (session as any).tenantName = token.tenantName;
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await controlDb
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .get();

        if (!user || !user.passwordHash) return null;

        // Dynamic bcrypt import (avoid edge runtime issues)
        const bcrypt = await import("bcryptjs");
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Load membership + tenant
        const membership = await controlDb
          .select({
            tenantId: memberships.tenantId,
            tenantName: tenants.name,
            tenantSlug: agentRegistry.slug,
          })
          .from(memberships)
          .innerJoin(tenants, eq(tenants.id, memberships.tenantId))
          .innerJoin(agentRegistry, eq(agentRegistry.tenantId, memberships.tenantId))
          .where(eq(memberships.userId, user.id))
          .get();

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: membership?.tenantId ?? null,
          tenantSlug: membership?.tenantSlug ?? null,
          tenantName: membership?.tenantName ?? null,
        };
      },
    }),
  ],
});
