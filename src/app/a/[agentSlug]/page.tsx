/**
 * WΛIDE° Public Chat Page
 *
 * Route: /a/[agentSlug]?src=whatsapp
 *
 * This is the customer-facing chat interface.
 * - No login required (guest-first)
 * - Mobile-first design
 * - Tracks source attribution via ?src= parameter
 */

import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { controlDb } from "@/lib/db/control";
import { agentRegistry, tenants } from "../../../../drizzle/schema/control";
import ChatInterface from "@/components/chat/ChatInterface";

interface PageProps {
  params: Promise<{ agentSlug: string }>;
  searchParams: Promise<{ src?: string }>;
}

export default async function AgentChatPage({ params, searchParams }: PageProps) {
  const { agentSlug } = await params;
  const { src } = await searchParams;
  const source = src || "direct";

  // Load agent config (server-side)
  const agent = await controlDb
    .select({
      id: agentRegistry.id,
      name: agentRegistry.name,
      persona: agentRegistry.persona,
      welcomeMessage: agentRegistry.welcomeMessage,
      primaryColor: agentRegistry.primaryColor,
      logoUrl: agentRegistry.logoUrl,
      isActive: agentRegistry.isActive,
      tenantName: tenants.name,
    })
    .from(agentRegistry)
    .innerJoin(tenants, eq(tenants.id, agentRegistry.tenantId))
    .where(eq(agentRegistry.slug, agentSlug))
    .get();

  if (!agent || !agent.isActive) {
    notFound();
  }

  return (
    <ChatInterface
      agentSlug={agentSlug}
      agentName={agent.name}
      businessName={agent.tenantName}
      welcomeMessage={
        agent.welcomeMessage ||
        `Hi! I'm ${agent.name}. How can I help you today? 👋`
      }
      primaryColor={agent.primaryColor || "#3a5cff"}
      logoUrl={agent.logoUrl}
      source={source}
    />
  );
}

export async function generateMetadata({ params }: { params: Promise<{ agentSlug: string }> }) {
  const { agentSlug } = await params;
  const agent = await controlDb
    .select({ name: agentRegistry.name, tenantName: tenants.name })
    .from(agentRegistry)
    .innerJoin(tenants, eq(tenants.id, agentRegistry.tenantId))
    .where(eq(agentRegistry.slug, agentSlug))
    .get();

  return {
    title: agent ? `${agent.tenantName} — Chat` : "WΛIDE° Chat",
  };
}
