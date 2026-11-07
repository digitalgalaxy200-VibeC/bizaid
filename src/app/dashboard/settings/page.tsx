"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SettingsState {
  agentName: string;
  slug: string;
  persona: string;
  welcomeMessage: string;
  primaryColor: string;
  logoUrl: string;
  chatLink: string;
  businessName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  openingHours: string;
}

const PRESET_COLORS = [
  "#3a5cff", // WΛIDE Indigo
  "#e11d48", // Rose / Beauty
  "#059669", // Emerald Green
  "#7c3aed", // Deep Violet
  "#ea580c", // Amber Warm
  "#0f172a", // Sleek Slate
];

const PRESET_PERSONAS = [
  {
    label: "Friendly & Warm (Recommended for Beauty & Retail)",
    value: "Friendly, enthusiastic, warm, and conversational. Always eager to help with beauty advice, skincare routines, and product recommendations.",
  },
  {
    label: "Professional & Polished",
    value: "Polished, courteous, and precise. Speaks on behalf of the business with executive professionalism and accurate facts.",
  },
  {
    label: "Concise & Fast",
    value: "Extremely direct and to the point. Answers questions in 1-2 short sentences without fluff. Optimized for fast WhatsApp mobile buyers.",
  },
];

export default function SettingsDashboardPage() {
  const [form, setForm] = useState<SettingsState>({
    agentName: "",
    slug: "",
    persona: "",
    welcomeMessage: "",
    primaryColor: "#3a5cff",
    logoUrl: "",
    chatLink: "",
    businessName: "",
    tagline: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    openingHours: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setForm({
            agentName: data.agent.name || "",
            slug: data.agent.slug || "",
            persona: data.agent.persona || "",
            welcomeMessage: data.agent.welcomeMessage || "",
            primaryColor: data.agent.primaryColor || "#3a5cff",
            logoUrl: data.agent.logoUrl || "",
            chatLink: data.agent.chatLink || "",
            businessName: data.profile.businessName || "",
            tagline: data.profile.tagline || "",
            description: data.profile.description || "",
            phone: data.profile.phone || "",
            email: data.profile.email || "",
            address: data.profile.address || "",
            city: data.profile.city || "",
            openingHours: data.profile.openingHours || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${form.chatLink}?src=whatsapp`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setStatusMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-6">
          <Link href="/dashboard" className="text-2xl font-black text-waide-900 tracking-tight">
            WΛIDE°
          </Link>
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              📊 Overview
            </Link>
            <Link
              href="/dashboard/conversations"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              💬 Conversations
            </Link>
            <Link
              href="/dashboard/knowledge"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              📚 Knowledge Base
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-waide-50 text-waide-700"
            >
              ⚙️ Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Settings Form */}
      <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Branding & Business Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Customize how your AI assistant looks, speaks, and answers questions on your behalf.
            </p>
          </div>
          {form.chatLink && (
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <span>{copied ? "✓ Copied to Clipboard!" : "📋 Copy WhatsApp Link"}</span>
            </button>
          )}
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-4 rounded-xl text-sm font-medium ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading settings...</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {/* Live Shareable Link Card */}
            <div className="bg-waide-50 border border-waide-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-waide-700 uppercase tracking-wider">Your Live Customer Chat Link</span>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  Share this on Instagram Bio, WhatsApp Status, or QR codes:
                </p>
                <code className="text-xs text-waide-800 bg-white/80 px-2 py-1 rounded mt-1 inline-block border border-waide-200">
                  {typeof window !== "undefined" ? window.location.origin : ""}{form.chatLink}?src=whatsapp
                </code>
              </div>
              <a
                href={form.chatLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-white text-waide-700 hover:bg-waide-100 border border-waide-300 rounded-xl text-xs font-bold transition text-center"
              >
                Open Live Chat ↗
              </a>
            </div>

            {/* Section 1: AI Assistant Persona & Tone */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-gray-900">1. AI Assistant Personality & Tone</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assistant Display Name</label>
                <input
                  type="text"
                  required
                  value={form.agentName}
                  onChange={(e) => setForm({ ...form, agentName: e.target.value })}
                  placeholder="e.g. Krish Beauty Assistant"
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-waide-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preset Tone of Voice</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {PRESET_PERSONAS.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setForm({ ...form, persona: p.value })}
                      className={`p-3 rounded-xl border cursor-pointer text-xs transition ${
                        form.persona === p.value
                          ? "border-waide-600 bg-waide-50/70 text-waide-900 font-medium"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <div className="font-semibold text-gray-900 mb-1">{p.label}</div>
                      <p className="line-clamp-3">{p.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Persona Instructions (Prompt)</label>
                <textarea
                  rows={3}
                  value={form.persona}
                  onChange={(e) => setForm({ ...form, persona: e.target.value })}
                  placeholder="Describe how the AI should talk, what it should encourage, and any words it should avoid..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-waide-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Greeting Message</label>
                <input
                  type="text"
                  value={form.welcomeMessage}
                  onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
                  placeholder="e.g. Hi! Welcome to Krish Beauty. How can I help you pick the right skincare product today? 👋"
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-waide-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Section 2: Visual Branding */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-gray-900">2. Chat Visual Branding</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setForm({ ...form, primaryColor: col })}
                      className={`w-9 h-9 rounded-full transition-transform ${
                        form.primaryColor.toLowerCase() === col.toLowerCase()
                          ? "scale-110 ring-2 ring-offset-2 ring-gray-900"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs text-gray-400">Custom:</span>
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="w-24 uppercase rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo URL</label>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://krishbeauty.com.ng/wp-content/uploads/logo.png"
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-waide-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Section 3: Business Information & Policies */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-gray-900">3. Business Profile & Contact Info</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-waide-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Support Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-waide-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Store Location / Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-waide-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={form.openingHours}
                    onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                    placeholder="e.g. Mon - Sat: 9:00 AM - 7:00 PM, Sun: Closed"
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-waide-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2 pb-10">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-waide-600 hover:bg-waide-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save All Settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
