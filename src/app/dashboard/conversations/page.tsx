"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Conversation {
  id: string;
  customerId: string | null;
  source: string | null;
  sourceRef: string | null;
  status: string;
  isHumanActive: boolean;
  startedAt: string;
  lastMessageAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export default function ConversationsDashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [togglingTakeover, setTogglingTakeover] = useState(false);
  const threadBottomRef = useRef<HTMLDivElement>(null);

  // Fetch list of conversations
  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (!selectedId && data.conversations?.length > 0) {
          setSelectedId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch thread messages when selectedId changes
  const loadThread = async (id: string) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConv(data.conversation);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadThread(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle takeover toggle (AI <-> Human)
  const handleToggleTakeover = async () => {
    if (!selectedId || !activeConv) return;
    setTogglingTakeover(true);
    const newState = !activeConv.isHumanActive;

    try {
      const res = await fetch("/api/takeover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedId,
          action: "toggle",
          isHumanActive: newState,
        }),
      });

      if (res.ok) {
        setActiveConv({ ...activeConv, isHumanActive: newState, status: newState ? "human" : "active" });
        setConversations(
          conversations.map((c) =>
            c.id === selectedId
              ? { ...c, isHumanActive: newState, status: newState ? "human" : "active" }
              : c
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingTakeover(false);
    }
  };

  // Handle human agent reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyText.trim()) return;

    setSendingReply(true);
    const textToSend = replyText;
    setReplyText("");

    try {
      const res = await fetch("/api/takeover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedId,
          action: "reply",
          replyContent: textToSend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setActiveConv((prev) => (prev ? { ...prev, isHumanActive: true, status: "human" } : null));
      } else {
        setReplyText(textToSend); // restore on error
      }
    } catch (err) {
      console.error(err);
      setReplyText(textToSend);
    } finally {
      setSendingReply(false);
    }
  };

  const getSourceBadge = (source: string | null) => {
    switch (source?.toLowerCase()) {
      case "whatsapp":
        return <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">WhatsApp</span>;
      case "instagram":
        return <span className="bg-pink-50 text-pink-700 text-xs px-2 py-0.5 rounded-full font-medium">Instagram</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">Web / Direct</span>;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
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
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-waide-50 text-waide-700"
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
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
            >
              ⚙️ Settings
            </Link>
          </nav>
        </div>
      </aside>

      {/* Conversations Feed Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List Column */}
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Conversations</h2>
            <button
              onClick={loadConversations}
              className="text-xs text-waide-600 hover:text-waide-700 font-medium"
            >
              Refresh
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loadingList ? (
              <div className="p-6 text-center text-sm text-gray-400">Loading chats...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                <div className="text-3xl mb-2">💬</div>
                No conversations yet. Once customers click your chat link, they will appear here.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === selectedId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? "bg-waide-50/70 border-l-4 border-waide-600" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {c.customerName || c.customerPhone || "Guest Visitor"}
                      </span>
                      {getSourceBadge(c.source)}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${
                          c.isHumanActive
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.isHumanActive ? "bg-amber-600" : "bg-blue-600"
                          }`}
                        />
                        {c.isHumanActive ? "Human Takeover" : "AI Active"}
                      </span>
                      <span>
                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "New"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Thread Column */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {activeConv ? (
            <>
              {/* Thread Header with Takeover Control */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {activeConv.customerName || activeConv.customerPhone || "Guest Visitor"}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span>Source: {activeConv.source || "Direct link"}</span>
                    {activeConv.customerPhone && <span>Phone: {activeConv.customerPhone}</span>}
                    {activeConv.customerEmail && <span>Email: {activeConv.customerEmail}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-700">
                      Mode: {activeConv.isHumanActive ? "Human Agent" : "AI Assistant"}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {activeConv.isHumanActive ? "AI responses paused" : "AI is answering automatically"}
                    </div>
                  </div>

                  <button
                    onClick={handleToggleTakeover}
                    disabled={togglingTakeover}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                      activeConv.isHumanActive
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-amber-500 hover:bg-amber-600 text-white"
                    }`}
                  >
                    {togglingTakeover
                      ? "Updating..."
                      : activeConv.isHumanActive
                      ? "▶ Hand Back to AI"
                      : "✋ Take Over Chat"}
                  </button>
                </div>
              </div>

              {/* Messages Thread Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingThread ? (
                  <div className="text-center py-12 text-sm text-gray-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-sm text-gray-400">No messages in this chat yet.</div>
                ) : (
                  messages.map((m) => {
                    const isUser = m.role === "user";
                    const isHuman = m.role === "human-agent";

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                      >
                        <span className="text-[11px] text-gray-400 mb-1 px-1">
                          {isUser
                            ? "Customer"
                            : isHuman
                            ? "Store Agent (You)"
                            : "AI Assistant"}
                        </span>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isUser
                              ? "bg-white text-gray-900 border border-gray-200 rounded-tl-sm shadow-sm"
                              : isHuman
                              ? "bg-amber-600 text-white rounded-tr-sm shadow-sm"
                              : "bg-waide-600 text-white rounded-tr-sm shadow-sm"
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={threadBottomRef} />
              </div>

              {/* Takeover Reply Input Box */}
              <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                {!activeConv.isHumanActive && (
                  <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-800">
                    <span>💡 The AI is currently active. Sending a reply will automatically switch this conversation to <strong>Human Takeover mode</strong>.</span>
                  </div>
                )}
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type an official reply to the customer..."
                    disabled={sendingReply}
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-waide-500 focus:ring-1 focus:ring-waide-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-5 py-2.5 bg-waide-600 hover:bg-waide-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
                  >
                    {sendingReply ? "Sending..." : "Send Reply"}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <div className="text-4xl mb-3">💬</div>
              <p className="font-medium text-gray-700">Select a conversation</p>
              <p className="text-sm text-gray-400 mt-1">Choose a chat from the left column to view the live thread and manage takeover.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
