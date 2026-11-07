"use client";

/**
 * WΛIDE° Chat Interface Component
 *
 * Mobile-first customer chat UI.
 * Uses Vercel AI SDK's useChat hook for streaming.
 * Guest session — no login required.
 */

import { useChat } from "ai/react";
import { useRef, useEffect, useState } from "react";
import { nanoid } from "nanoid";

interface Props {
  agentSlug: string;
  agentName: string;
  businessName: string;
  welcomeMessage: string;
  primaryColor: string;
  logoUrl?: string | null;
  source: string;
}

export default function ChatInterface({
  agentSlug,
  agentName,
  businessName,
  welcomeMessage,
  primaryColor,
  logoUrl,
  source,
}: Props) {
  const [sessionToken] = useState(() => nanoid());
  const [conversationId] = useState<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: { agentSlug, sessionToken, conversationId, source },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: welcomeMessage,
      },
    ],
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-lg mx-auto">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 text-white shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={businessName} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            {businessName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-semibold text-sm leading-tight">{businessName}</div>
          <div className="text-xs opacity-75">{agentName} • AI Assistant</div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "text-white rounded-br-sm"
                  : "bg-white text-gray-800 shadow-sm rounded-bl-sm"
              }`}
              style={m.role === "user" ? { backgroundColor: primaryColor } : {}}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 px-4 py-3 bg-white border-t border-gray-100"
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40 flex-shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>

      {/* Powered by */}
      <div className="text-center py-2 text-xs text-gray-400 bg-white">
        Powered by WΛIDE°
      </div>
    </div>
  );
}
