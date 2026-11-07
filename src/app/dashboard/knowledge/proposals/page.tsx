"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Proposal {
  id: string;
  conversationId: string | null;
  question: string;
  proposedAnswer: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  createdAt: string;
}

export default function KnowledgeProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("General");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProposals = async () => {
    try {
      const res = await fetch("/api/proposals");
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleAction = async (proposalId: string, action: "approve" | "reject") => {
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          action,
          officialAnswer: action === "approve" ? answerDraft : undefined,
          category: action === "approve" ? categoryDraft : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} proposal`);

      setStatusMessage({
        type: "success",
        text: action === "approve" ? "✓ Question approved and added to live AI knowledge!" : "Proposal rejected.",
      });

      setActiveProposalId(null);
      setAnswerDraft("");
      fetchProposals();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const reviewedProposals = proposals.filter((p) => p.status !== "pending");

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
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-waide-50 text-waide-700 font-semibold"
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
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/knowledge" className="text-sm text-waide-600 hover:underline">
                ← Knowledge Base
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Controlled Learning Proposals</h1>
            <p className="text-sm text-gray-500 mt-1">
              Customer questions that your AI assistant couldn't answer yet. Review and approve them to train your AI automatically.
            </p>
          </div>
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

        {/* Pending Questions Section */}
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Unanswered Questions Awaiting Review</span>
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {pendingProposals.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">Loading proposals...</div>
          ) : pendingProposals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
              <div className="text-3xl mb-2">🎉</div>
              <p className="font-semibold text-gray-800">All clear! No pending gap questions.</p>
              <p className="text-xs text-gray-500 mt-1">
                Whenever a customer asks a question your AI doesn't know, it will appear here for one-click approval.
              </p>
            </div>
          ) : (
            pendingProposals.map((proposal) => {
              const isEditing = activeProposalId === proposal.id;

              return (
                <div
                  key={proposal.id}
                  className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Customer Asked
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-1.5">
                        "{proposal.question}"
                      </h3>
                      <span className="text-[11px] text-gray-400">
                        Asked on {new Date(proposal.createdAt).toLocaleDateString()} at{" "}
                        {new Date(proposal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {!isEditing && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setActiveProposalId(proposal.id);
                            setAnswerDraft(proposal.proposedAnswer || "");
                          }}
                          className="px-3.5 py-2 bg-waide-600 hover:bg-waide-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                        >
                          Write Answer & Approve
                        </button>
                        <button
                          onClick={() => handleAction(proposal.id, "reject")}
                          disabled={submitting}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Official Approved Answer
                        </label>
                        <textarea
                          rows={3}
                          value={answerDraft}
                          onChange={(e) => setAnswerDraft(e.target.value)}
                          placeholder="Provide the exact answer your AI should give to this question in the future..."
                          className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-waide-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <input
                          type="text"
                          value={categoryDraft}
                          onChange={(e) => setCategoryDraft(e.target.value)}
                          placeholder="Category (e.g. Delivery, Pricing)"
                          className="w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-waide-500 focus:outline-none"
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveProposalId(null)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(proposal.id, "approve")}
                            disabled={submitting || !answerDraft.trim()}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm"
                          >
                            {submitting ? "Saving..." : "✓ Approve & Train AI"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Previously Reviewed Section */}
        {reviewedProposals.length > 0 && (
          <div className="mt-12 space-y-4">
            <h2 className="text-base font-bold text-gray-700">Previously Reviewed Questions</h2>
            <div className="divide-y divide-gray-200 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {reviewedProposals.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{p.question}</span>
                    {p.proposedAnswer && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">Answer: {p.proposedAnswer}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      p.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
