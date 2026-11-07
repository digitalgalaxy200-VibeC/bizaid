/**
 * WΛIDE° Dashboard — Overview
 * Business owner home after login.
 */
import { redirect } from "next/navigation";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome to your WΛIDE° business hub</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Conversations" value="—" />
          <StatCard label="AI Messages Sent" value="—" />
          <StatCard label="Human Takeovers" value="—" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickLink href="/dashboard/conversations" title="Conversations" desc="View and manage customer chats" />
          <QuickLink href="/dashboard/knowledge" title="Knowledge Base" desc="Manage what your AI knows" />
          <QuickLink href="/dashboard/settings" title="Settings" desc="Update your business profile" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a
      href={href}
      className="bg-white rounded-xl border border-gray-100 p-5 hover:border-waide-300 hover:shadow-sm transition-all block"
    >
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{desc}</div>
    </a>
  );
}
