/**
 * WΛIDE° Platform Admin — Overview
 *
 * Cross-tenant view of every business on the platform. Reads only from the
 * control DB (tenant DBs are never queried here).
 *
 * Tenant DB credentials are cached server-side and are deliberately never
 * rendered — only the hostname is shown.
 */
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { controlDb } from "@/lib/db/control";
import {
  users,
  tenants,
  memberships,
  agentRegistry,
  platformAdmins,
} from "../../../drizzle/schema/control";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return new Date(value).toISOString().slice(0, 10);
}

function hostname(dbUrl: string): string {
  return dbUrl.replace(/^libsql:\/\//, "");
}

export default async function AdminOverviewPage() {
  const [userCountRow] = await controlDb
    .select({ n: sql<number>`count(*)` })
    .from(users);
  const [tenantCountRow] = await controlDb
    .select({ n: sql<number>`count(*)` })
    .from(tenants);
  const [agentCountRow] = await controlDb
    .select({ n: sql<number>`count(*)` })
    .from(agentRegistry);
  const [adminCountRow] = await controlDb
    .select({ n: sql<number>`count(*)` })
    .from(platformAdmins);

  const tenantRows = await controlDb
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      plan: tenants.plan,
      status: tenants.status,
      dbUrl: tenants.dbUrl,
      createdAt: tenants.createdAt,
      ownerEmail: users.email,
      agentSlug: agentRegistry.slug,
      agentActive: agentRegistry.isActive,
    })
    .from(tenants)
    .leftJoin(memberships, eq(memberships.tenantId, tenants.id))
    .leftJoin(users, eq(users.id, memberships.userId))
    .leftJoin(agentRegistry, eq(agentRegistry.tenantId, tenants.id))
    .orderBy(desc(tenants.createdAt))
    .limit(100);

  const adminRows = await controlDb
    .select({
      userId: platformAdmins.userId,
      email: users.email,
      name: users.name,
      grantedAt: platformAdmins.grantedAt,
      grantedBy: platformAdmins.grantedBy,
    })
    .from(platformAdmins)
    .leftJoin(users, eq(users.id, platformAdmins.userId))
    .orderBy(desc(platformAdmins.grantedAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every business, assistant and admin on this WΛIDE° deployment.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Businesses" value={tenantCountRow?.n ?? 0} />
        <StatCard label="Users" value={userCountRow?.n ?? 0} />
        <StatCard label="Assistants" value={agentCountRow?.n ?? 0} />
        <StatCard label="Platform admins" value={adminCountRow?.n ?? 0} />
      </div>

      <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Businesses</h2>
          <span className="text-xs text-gray-400">
            {tenantRows.length} shown
          </span>
        </div>

        {tenantRows.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No businesses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Assistant</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tenantRows.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-400">
                        /{t.slug}
                        {t.dbUrl ? ` · ${hostname(t.dbUrl)}` : ""}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {t.ownerEmail ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      {t.agentSlug ? (
                        <Link
                          href={`/a/${t.agentSlug}`}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          /a/{t.agentSlug}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      {t.agentActive === false && (
                        <span className="ml-2 text-xs text-amber-600">
                          inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          t.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Platform admins</h2>
          <p className="text-xs text-gray-400 mt-1">
            Grants live in <code>platform_admins</code>. Changes apply at next
            sign-in.
          </p>
        </div>
        <ul className="divide-y divide-gray-50">
          {adminRows.map((a) => (
            <li
              key={a.userId}
              className="px-5 py-3 flex items-center justify-between text-sm"
            >
              <div>
                <div className="font-medium text-gray-900">
                  {a.name ?? "Unnamed admin"}
                </div>
                <div className="text-xs text-gray-400">{a.email ?? a.userId}</div>
              </div>
              <div className="text-xs text-gray-400 text-right">
                <div>granted {formatDate(a.grantedAt)}</div>
                {a.grantedBy && <div>by {a.grantedBy}</div>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}
