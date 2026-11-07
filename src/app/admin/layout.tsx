/**
 * WΛIDE° Platform Admin Layout
 *
 * Cross-tenant area. Access requires the `isPlatformAdmin` claim, which is
 * issued at sign-in from the `platform_admins` table.
 *
 * The middleware already blocks unauthenticated/non-admin requests; this
 * server-side check is defence in depth (and covers direct RSC requests).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/auth/login");
  if (!(session as any).isPlatformAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-tight text-gray-900">
              WΛIDE°
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              Platform Admin
            </span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Overview
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              My dashboard
            </Link>
            <span className="text-gray-400 hidden sm:inline">
              {session.user?.email}
            </span>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}
