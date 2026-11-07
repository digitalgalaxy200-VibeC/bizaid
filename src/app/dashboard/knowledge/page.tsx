"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface KnowledgeItem {
  id: string;
  type: string;
  question: string | null;
  answer: string;
  category: string | null;
  createdAt: string;
}

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: "faq",
    question: "",
    answer: "",
    category: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/knowledge");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add knowledge");

      setIsModalOpen(false);
      setForm({ type: "faq", question: "", answer: "", category: "" });
      fetchItems();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between hidden md:flex">
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
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-waide-50 text-waide-700"
            >
              📚 Knowledge Base
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              ⚙️ Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="text-sm text-gray-500 mt-1">
              Teach your AI assistant about your products, policies, and frequently asked questions.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/knowledge/import"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <span>⚡ Import Catalog / Feed</span>
            </Link>
            <Link
              href="/dashboard/knowledge/proposals"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <span>💡 Learning Proposals</span>
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-waide-600 hover:bg-waide-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <span>+ Add FAQ</span>
            </button>
          </div>
        </div>

        {/* Knowledge Items List */}
        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading knowledge items...</div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="text-base font-semibold text-gray-900">Your Knowledge Base is Empty</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-5">
                Add FAQs, delivery terms, and product info so your AI can immediately respond accurately to customer messages.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-waide-600 hover:bg-waide-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Add Your First Item
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-2 hover:border-gray-200 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-waide-100 text-waide-800 uppercase">
                    {item.type}
                  </span>
                  {item.category && (
                    <span className="text-xs text-gray-400">{item.category}</span>
                  )}
                </div>
                {item.question && (
                  <h4 className="text-sm font-semibold text-gray-900">Q: {item.question}</h4>
                )}
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Knowledge Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add Business Knowledge</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-waide-500 focus:outline-none"
                  >
                    <option value="faq">FAQ (Question & Answer)</option>
                    <option value="policy">Policy (Delivery, Returns, Payment)</option>
                    <option value="info">General Info (Address, Hours, Tagline)</option>
                  </select>
                </div>

                {form.type === "faq" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Do you deliver to Lekki / Ikeja?"
                      value={form.question}
                      onChange={(e) => setForm({ ...form, question: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-waide-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.type === "faq" ? "Answer" : "Details / Content"}
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide the exact factual information your AI should use..."
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-waide-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Logistics, Pricing, Services"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-waide-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-waide-600 hover:bg-waide-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Knowledge"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
